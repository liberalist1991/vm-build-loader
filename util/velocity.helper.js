var fs = require('fs');
var velocity = require('velocityjs');
var _path = require('path')

function clearCode(code) {
    // \r\n
    code = code.replace(/\r\n/g, '\n');

    // \t
    code = code.replace(/\t/g, '    ');

    // ##
    code = code.replace(/##.*/g, '');

    // #**#
    code = code.replace(/#\*(.*\n)*\*#/g, '');

    // Line End Space
    code = code.replace(/ +\n/g, '\n');

    // more \n
    code = code.replace(/\n{2,}/g, '\n\n');

    // head and end \n
    code = code.replace(/^\n+/g, '');
    code = code.replace(/\n+$/g, '\n');

    return code;
}



function parseJs(curModule, parentModule, basePath) {
    if (curModule && parentModule) {
        var parentJs = _path.join(basePath, `${parentModule}.js`);
        var parentVmContent = fs.readFileSync(parentJs, 'utf8');

        if (new RegExp(`${curModule}`).test(parentVmContent)) {
            return;
        }
        fs.writeFileSync(parentJs,
            `${parentVmContent}
            require('./${curModule}/${curModule}.scss')
            require('./${curModule}/${curModule}.js')`,
            'utf8');
    }
}
function processParse(code, basePath, vmPath, zIndex) {
    // clear
    code = clearCode(code);

    // parse
    var parseReg = /[\n | ]+#parse\(.*\)/g;
    var parseList = code.match(parseReg);
    var parseStartReg = /^#parse\(.*\)/;
    var parseStart = code.match(parseStartReg);

    if (parseStart) {
        parseList = parseList || [];
        parseList.unshift(parseStart[0]);
    }

    if (!parseList) {
        return code;
    }

    parseList.forEach(function (val, i) {
        var pathReg = /['|"](.*)['|"]/;
        var path = pathReg.exec(val)[1];
        var parseCode = fs.readFileSync(_path.join(basePath, './', path), 'utf8');

        if (zIndex === 1) {
            parseJs(_path.basename(path).split('.')[0],
                _path.basename(vmPath).split('.')[0], basePath);
        }

        var space = val.match(/ /g) || [];
        var space = space.join('');

        // 处理缩进
        parseCode = clearCode(parseCode);
        parseCode = parseCode.replace(/\n/g, '\n' + space);
        parseCode = '\n\n' + space + parseCode + '\n\n';

        code = code.replace(val, parseCode);
    });
    return processParse(code, basePath, vmPath, ++zIndex);
}

var vmHelper = {
    clearCode: clearCode,
    processParse: processParse,
    render: velocity.render
};

exports = module.exports = vmHelper;

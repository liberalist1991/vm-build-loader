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


// 解析vm模块依赖的js 写入依赖
function parseVtlJs(curModule, vmPath, relativePath) {

        var vmJs = vmPath.replace('.vm', '.js');

        var vmJSCode = fs.readFileSync(vmJs, 'utf8');

        if (new RegExp(`${curModule}`).test(vmJSCode)) {
            return;
        }
        fs.writeFileSync(vmJs,
            `${vmJSCode}
            require('${relativePath.replace('.vtl', '.scss')}')
            require('${relativePath.replace('.vtl', '.js')}')`,
            'utf8');

}

// syncStatic：是否自动写入静态依赖
function processParse(code, vmPath, syncStatic, watcher) {
    // clear
    code = clearCode(code);

    // parse
    let parseReg = /[\n | ]+#parse\(.*\)/g;
    let parseList = code.match(parseReg);
    let parseStartReg = /^#parse\(.*\)/;
    let parseStart = code.match(parseStartReg);

    if (parseStart) {
        parseList = parseList || [];
        parseList.unshift(parseStart[0]);
    }

    if (!parseList) {
        return code;
    }
    parseList.forEach(function (val, i) {
        let pathReg = /['|"](.*)['|"]/;
        let curModule = pathReg.exec(val)[1];

        let curModuleVtlPath;

        // 通用写法
        if (curModule.indexOf('/') > 0) {
            curModuleVtlPath = _path.resolve(`src/module/${curModule.replace(/^\//, '')}`);
        } else { //模块
            curModuleVtlPath = _path.resolve(`src/module/${curModule}/${curModule}.vtl`);
        }
        if (!!syncStatic) {
            parseVtlJs(curModule, vmPath, _path.relative(_path.dirname(vmPath), curModuleVtlPath));
        }
        watcher(curModuleVtlPath)

        let vtlCode = fs.readFileSync(curModuleVtlPath, 'utf8');

        var space = val.match(/ /g) || [];
        var space = space.join('');

        // 处理缩进
        vtlCode = clearCode(vtlCode);
        vtlCode = vtlCode.replace(/\n/g, '\n' + space);
        vtlCode = '\n\n' + space + vtlCode + '\n\n';

        code = code.replace(val, vtlCode);
    });

    return processParse(code, vmPath, false, watcher);
}


var vmHelper = {
    clearCode: clearCode,
    processParse: processParse,
    render: velocity.render
};

exports = module.exports = vmHelper;

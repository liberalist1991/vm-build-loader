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
function parseVtlJs(curModule, vmPath, relativePath, moduleFullName, curModule) {

        // 读取.vm同名.js
        var vmJs = vmPath.replace('.vm', '.js');
        var vmJSCode = fs.readFileSync(vmJs, 'utf8');

        // 若.js已经写过模块 则返回
        if (new RegExp(`${curModule}/${curModule}`).test(vmJSCode)) {
            return;
        }
        // pagelet.tpl -> module.scss||js
        fs.writeFileSync(vmJs,
            `${vmJSCode}
            require('${relativePath.replace(moduleFullName, curModule + '.scss')}')
            require('${relativePath.replace(moduleFullName, curModule + '.js')}')`,
            'utf8');

}

// syncStatic：是否自动写入静态依赖
function processParse(code, vmPath, syncStatic, options, watcher, _modules) {
    // clear
    code = clearCode(code);

    // parse
    const parseReg = /[\n | ]+#(parse|parseTmpl)\(.*\)/g;

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

        let curModuleVtlPath, moduleFullName;
        let moduleWrapper = '';

        // #parseTmpl(module/module1/module1.tpl)
        if (val.indexOf('parseTmpl') > 0) {
            curModuleVtlPath = _path.resolve(`src/${curModule.replace(/^\//, '')}`);
        }
        // #parse(module1/module1.tpl)
        else if (curModule.indexOf('/') > 0) {
            curModuleVtlPath = _path.resolve(`src/module/${curModule.replace(/^\//, '')}`);
        }
        //#parse(module1)
        else {
            moduleFullName = (options.moduleTpl || curModule) + options.moduleTplSuffix;
            curModuleVtlPath = _path.resolve(`src/module/${curModule}/${moduleFullName}`);

            if (_modules) {

                if (!_modules[curModule]) {
                    _modules[curModule] = 1;

                } else {
                    _modules[curModule] = _modules[curModule] + 1;

                }

                let count = _modules[curModule] - 1;

                // 同一模块调多次 数据可写list 按顺序渲染
                moduleWrapper = `
                    #if($${curModule}-list && $${curModule}-list.size() > ${count})
                        #set($${curModule} = $${curModule}-list[${count}])
                    #else
                        #set($${curModule} = {})
                    #end
                    `
            }

        }

        // 需要写入模块js scss依赖
        if (syncStatic != false) {
            parseVtlJs(curModule, vmPath, _path.relative(_path.dirname(vmPath), curModuleVtlPath), moduleFullName, curModule);
        }

        watcher(curModuleVtlPath)

        let vtlCode = fs.readFileSync(curModuleVtlPath, 'utf8');


        var space = val.match(/ /g) || [];
        var space = space.join('');

        // 处理缩进
        vtlCode = clearCode(vtlCode);
        vtlCode = vtlCode.replace(/\n/g, '\n' + space);
        vtlCode = '\n\n' + space + vtlCode + '\n\n';

        code = code.replace(val, moduleWrapper + vtlCode);
    });

    return processParse(code, vmPath, false, options, watcher, _modules);

}


var vmHelper = {
    clearCode: clearCode,
    processParse: processParse,
    render: velocity.render
};

exports = module.exports = vmHelper;

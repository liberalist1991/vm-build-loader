'use strict';
const path = require('path')
const fs = require('fs')
const CFG = require('./cfg');

class Parser {
    constructor(ctx, source) {
        // loader
        this.ctx = ctx;
        this.source = source;
        this.output = source;
        // /src/page/somepage
        this.pagePath = this.ctx.context;
        // /somepage
        this.pageName = path.basename(this.pagePath);
        this.projectPath = this.pagePath.replace(/src.*$/, '');
        this.VmDataPath = path.resolve(CFG.vmData, `${this.pageName}.js`);
        this.vmMeta = null;
        this.directives = CFG.directives;

        this.run();
    }

    run() {
        this.watch(this.ctx.resourcePath);
        this.watch(this.VmDataPath);
        delete require.cache[this.VmDataPath]
        this.output = this.processParse(this.source);
    }

    processParse(code) {
        const parseReg = new RegExp(`\\#(${this.directives.join('|')})\(\\[.*\\]\)`, 'g')
        let parseList = code.match(parseReg);

        parseList && parseList.forEach((directive, i) => {
            let pathReg = /\[(.*)\]/, typeReg = /\#(.*)\[/;
            let modules = pathReg.exec(directive)[0],
                type = typeReg.exec(directive)[1];

            let tmp = '';

            eval(modules).forEach((module, index) => {
                let template = this.getModuleTpl(module, type);
                tmp = tmp + '\n' + this.processParse(template);
            });

            code = code.replace(directive, tmp);
        })

        return code;
    }

    getVmData() {
        if (fs.existsSync(this.VmDataPath)) {
            this.vmMeta = require(this.VmDataPath);
        }
        return this.vmMeta;
    }

    getModuleTpl(module, type) {
        // module/index.vm, or module.vm
        let moduleTplPath = path.resolve('src', type, module, 'index.html');
        if (!fs.existsSync(moduleTplPath)) {
            moduleTplPath = path.resolve('src', type, `${module}.html`)
        }

        this.watch(moduleTplPath);
        return fs.readFileSync(moduleTplPath, 'utf8');
    }

    watch(dependency) {
        this.ctx.addDependency(dependency)
    }

    getOutput() {
        return this.output;
    }

    safeStr(str) {
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#039;");
    }
}

module.exports = Parser

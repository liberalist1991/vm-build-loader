'use strict';
const velocity = require('velocityjs');
const loaderUtils = require('loader-utils')
const path = require('path')
const fs = require('fs')
const Parser = require('./compiler/Parser')
const Render = require('./compiler/Render')

const Parser_old = require('./compiler_old/parser_old')

module.exports = function (source) {
    if (this.cacheable) {
        this.cacheable(true);
    }
    const callback = this.async();
    const options = loaderUtils.getOptions(this);

    if (options.upgrade) {
        const vmParser = new Parser(this, source);
        const vmData = vmParser.getVmData();
        let output = vmParser.getOutput();

        if (options.env !== 'prod') {
            const vmRender = new Render(output, vmData);
            output = vmRender.getOutput();
            output = output.replace(/\<\/\s*body\s*>/, `
                <script>
                    console.log('直出数据：', ${vmParser.safeStr(JSON.stringify(vmData))})
                </script>
                </body>
            `);
        }

        callback(null, output);
    } else {
        callback(null, Parser_old(this, source));
    }

}

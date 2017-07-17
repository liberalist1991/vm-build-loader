'use strict';
const loaderUtils = require('loader-utils')
const path = require('path')
const fs = require('fs')
const VmHelper = require('./util/velocity.helper.js')

let watcher;

module.exports = function (source) {

    if (this.cacheable) {
        this.cacheable(true)
    }
    const callback = this.async();
    const options = loaderUtils.getOptions(this);
    // /src/page/somepage/page.vm
    const vmPath = this.resourcePath;
    // /src/page/somepage
    const pagePath = path.dirname(vmPath);
    // /somepage.vm
    const pageName = path.basename(pagePath);

    if (!/page/.test(pagePath)) {
        callback(null, source);
        return
    }

    const vmDataPath = path.resolve(`src/data-vm/data-${pageName}.js`);
    const vmMetaPath = path.join(`src/data-vm/data-${pageName}.vm`);

    watcher = this.addDependency
    watcher(vmDataPath);
    watcher(vmMetaPath);

    //清除require缓存
    delete require.cache[vmDataPath]
    const vmData = require(vmDataPath);

    const vmMeta = fs.readFileSync(vmMetaPath, 'utf8');

    let sourceAll = VmHelper.processParse(source, vmPath, options.syncStatic != false , watcher);

    let tmpSourceAll = sourceAll.split('<html');

    sourceAll = options.env === 'prod' ? `${tmpSourceAll[0]}${vmMeta}<html${tmpSourceAll[1]}`
        : `${tmpSourceAll[0]}
        <script>
            console.log('直出数据：', ${JSON.stringify(vmData)})
        </script>
        ${vmMeta}<html${tmpSourceAll[1]}`;

    let result = options.env === 'prod' ?
        sourceAll : VmHelper.render(sourceAll, vmData, null, {
            escape: false
        });

    callback(null, result);
}

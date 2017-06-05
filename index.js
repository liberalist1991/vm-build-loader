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

    const vmPath = this.resourcePath;
    const vmName = path.basename(vmPath, '.vm');

    const vmDirPath = path.dirname(vmPath);
    const srcPath = path.dirname(vmDirPath);

    if (!/page$/.test(vmDirPath)) {
        callback(null, source);
        return
    }

    const vmDataPath = path.join(srcPath, `data-vm/data-${vmName}.js`);
    const vmMetaPath = path.join(srcPath, `data-vm/data-${vmName}.vm`);

    watcher = this.addDependency
    watcher(vmDataPath);
    watcher(vmMetaPath);

    //清除require缓存
    delete require.cache[vmDataPath]
    const vmData = require(vmDataPath);

    const vmMeta = fs.readFileSync(vmMetaPath, 'utf8');

    let sourceAll = VmHelper.processParse(source, vmPath, srcPath, 1, watcher);

    let tmpSourceAll = sourceAll.split('<body');

    sourceAll = `${tmpSourceAll[0]}${vmMeta}<body${tmpSourceAll[1]}`

    let result = options.env === 'prod' ?
        sourceAll : VmHelper.render(sourceAll, vmData);

    callback(null, result);
}

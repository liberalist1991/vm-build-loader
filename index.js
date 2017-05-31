'use strict';
const loaderUtils = require('loader-utils')
const path = require('path')
const fs = require('fs')
const VmHelper = require('./util/velocity.helper.js')

let watcher;

module.exports = function (content) {
    if (this.cacheable) {
        this.cacheable(true)
    }
    const callback = this.async();
    const options = loaderUtils.getOptions(this);
    const filePath = this.resourcePath;
    const fileName = path.basename(filePath).split('.')[0];
    const fileDirPath = path.dirname(filePath);
    const mockPath = path.join(fileDirPath, `../data/data-${fileName}.js`);

    watcher = this.addDependency
    watcher(mockPath);

    //清除require缓存
    delete require.cache[mockPath]
    const mock = require(mockPath);


    let contentAll = VmHelper.processParse(content, fileDirPath, filePath, 1);

    let result = '';
    if (options.env === 'prod') {
        result = contentAll;
    } else {
        result = VmHelper.render(contentAll, mock);
    }

    callback(null, result);
}

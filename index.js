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
    if (!options.moduleTplSuffix) {
        options.moduleTplSuffix = '.vtl'
    }
    // /src/page/somepage/page.vm
    const vmPath = this.resourcePath;
    // /src/page/somepage
    const pagePath = path.dirname(vmPath);
    // /somepage
    const pageName = path.basename(pagePath);

    if (!/page/.test(pagePath)) {
        callback(null, source);
        return
    }

    const vmDataPath = path.resolve(
        `src/${options.vmDataDir || 'data-vm'}/data-${pageName}${options.vmDataSuffix || '.js'}`
    );
    const vmMetaPath = path.join(`src/${options.vmDataDir || 'data-vm'}/data-${pageName}.vm`);

    watcher = this.addDependency
    watcher(vmDataPath);
    watcher(vmMetaPath);

    //清除require缓存
    delete require.cache[vmDataPath]
    const vmData = require(vmDataPath);

    const vmMeta = fs.readFileSync(vmMetaPath, 'utf8');

    let sourceAll = VmHelper.processParse(source, vmPath, options.syncStatic != false, options,
        watcher, {});

    let splits = sourceAll.split(/\<\s*html\s*>/);

    sourceAll = options.env === 'prod' ? `${splits[0]}<html>${vmMeta}${splits[1]}` :
        `${splits[0]}<html>${vmMeta}
        <script>
            console.log('直出数据：', ${safeStr(JSON.stringify(vmData))})
        </script>
        ${splits[1]}
        `;

    let result = options.env === 'prod' ?
        sourceAll : VmHelper.render(sourceAll, vmData, null, {
            escape: false
        });

    callback(null, result);
}

function safeStr(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#039;");
}

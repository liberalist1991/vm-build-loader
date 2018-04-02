'use strict';
const loaderUtils = require('loader-utils')
const path = require('path')
const fs = require('fs')
const VmHelper = require('./util/velocity.helper.js')

let watcher;

module.exports = function (ctx, source) {

    const options = loaderUtils.getOptions(ctx);
    if (!options.moduleTplSuffix) {
        options.moduleTplSuffix = '.vtl'
    }
    // /src/page/somepage/page.vm
    const vmPath = ctx.resourcePath;
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

    watcher = ctx.addDependency
    watcher(vmDataPath);
    watcher(vmMetaPath);

    //清除require缓存
    delete require.cache[vmDataPath]
    const vmData = require(vmDataPath);

    const vmMeta = fs.readFileSync(vmMetaPath, 'utf8');

    let sourceAll = VmHelper.processParse(source, vmPath, options.syncStatic != false , options, watcher, options.dataList ? {} : false);

    let splits = sourceAll.split(/\<\s*html\s*>/);

    if (splits[1]) {
        sourceAll = options.env === 'prod' ? `${splits[0]}<html>${vmMeta}${splits[1]}` :
            `${splits[0]}<html>${vmMeta}
            <script>
                console.log('直出数据：', ${safeStr(JSON.stringify(vmData))})
            </script>
            ${splits[1]}
            `;
    } else {
        sourceAll = options.env === 'prod' ? `${vmMeta}${sourceAll}` :
            `${vmMeta}
            <script>
                console.log('直出数据：', ${safeStr(JSON.stringify(vmData))})
            </script>
            ${sourceAll}
            `;
    }

    let result = options.env === 'prod' ?
        sourceAll : VmHelper.render(sourceAll, vmData, null, {
            escape: false
        });

    return result;
}

function safeStr(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#039;");
}

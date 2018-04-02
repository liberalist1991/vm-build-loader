```
{
    test: /\.(vm)$/,
    loader: 'raw-loader!vm-build-loader',
    query: {
        env: dev,
        syncStatic: false, // 同步静态, 默认true
        moduleTpl: pagelet, // 模块tpl名，默认和模块同名
        moduleTplSuffix: .html, // 模块tpl后缀，默认.vtl
        vmDataDir: data, // 直出存放目录，默认data-vm
        vmDataSuffix: .es  // 直出文件存放后缀，默认.js
    }
}
```

> 约束

```
    -src
        -page
            -entry1
                -page.vm
                -page.js
        -module
            -module1
                -pagelet.html
                -module1.js
                -module1.scss
        -data
            data-entry1.es
            data-entry1.vm

```

```
// #parse(module1)

// #parse(module1/module1.tpl)
// #parseTmpl(module/module1/module1.tpl)

```

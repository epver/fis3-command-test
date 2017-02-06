# fis3-command-test

> 基于 fis3-command-server 开发, 添加 http-proxy-middleware, 使服务器具有代理服务器的功能!

## 使用简介

在项目文件夹的根目录添加 test-config.js 文件进行配置服务器内容,以及服务器代理内容!

```javascript
module.exports = {
  // document root, 服务器根目录
  root: 'C:/Users/Cheney/AppData/Local/.fis3-tmp/www',
  // server prot 服务端口
  port: 8080,
  // 断线重连时间
  timeout: 30,
  // 是否需要开启浏览器
  browse: false,
  // 使用真实ip地址
  daemon: true,
  // 使用 https
  https: false,
  // http-proxy-middleware 配置使用
  proxy: {
    '/api_oauth**': {
      target: 'http://127.0.0.1:8081',
      changeOrigin: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api_oauth(.*?)': ''
      }
    }
  },
  // connect-history-api-fallback 配置路由重写规则 (其中from为正则规则)
  router: [
    { from: '^\/login$', to: '/html/login/login.html' }
  ]
}

```

以上任何一项都可以为空, 也可以test-config.js也为空

## 替换test-config.js

使用多套配置, 在 `fis-conf.js` 中配置如下

```javascript
fis.config.set('project.test', 'test-config.js')

```

### 插件由来

由于自己目前公司的项目,处理的接口比较奇葩, 所以根据 fis3-command-server 开发了一个可以反向代理的测试服务器!

### 1.0.1 新增

- 新增路由编写,用于后面处理纯前端的项目,使用 `connect-history-api-fallback` 包创建路由重写测试方案

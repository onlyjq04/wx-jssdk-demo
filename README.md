### 微信 js-sdk 后台签名&前端接入demo

1. 请申请一个[公众测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)
2. 在根目录下创建`config.js`文件, 格式如下:  
```javascript
module.exports = {
  token: '', //自己建
  appId: '',
  appSecret: ''
}
```
3. 在测试号设置页面配置安全域名(目标域名)
4. `app/index.js`中请求服务器域名改成你自己的域名(签名服务器域名)

请用微信开发者工具进行调试
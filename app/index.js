window.onload = function() {
  axios.get('http://127.0.0.1:8989/wechat/sign?url=www.example.com').then(resp => {
    const { nonceStr, timestamp, appId, signature } = resp.data.sign
    wx.config({
      debug: true,
      appId,
      nonceStr,
      timestamp,
      signature,
      jsApiList: ['getLocation']
    })
  })
  wx.ready(() => {
    console.log('ready')
  })
  wx.error(err => {
    console.log(err)
  })
}

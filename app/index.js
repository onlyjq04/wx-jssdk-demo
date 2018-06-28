window.onload = function() {
  const currentUrl = encodeURIComponent(location.href.split('#')[0])
  console.log(currentUrl)
  axios({
    methods: 'GET',
    url: 'https://www.example.com/wechat/sign?url=' + currentUrl
  }).then(resp => {
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

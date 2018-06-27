const express = require('express')
const crypto = require('crypto')
const { createHash, randomBytes } = crypto
const config = require('../config')
const cache = require('memory-cache')
const Axios = require('axios')
const co = require('co')
const cors = require('cors')
const logger = require('./logger')

const ACCESS_TOKEN_URL = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${
  config.appID
}&secret=${config.appsecret}`

const CACHE_EXPIRY = 1000 * 72 * 1000

function getTicketURL(accessToken) {
  return `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
}

function putToCache(key, val) {
  cache.put(key, val, CACHE_EXPIRY)
}

function getTicket() {
  return co(function*() {
    let ticket = cache.get('ticket')

    if (!ticket) {
      const tokenResp = yield Axios({
        url: ACCESS_TOKEN_URL,
        method: 'GET'
      })
      const accessToken = tokenResp.data.access_token
      logger.info('New access token acquired: ', accessToken)

      const ticketURL = getTicketURL(accessToken)
      const ticketResp = yield Axios({
        url: ticketURL,
        method: 'GET'
      })
      ticket = ticketResp.data.ticket
      putToCache('ticket', ticket)
      logger.info('New ticket acquired: ', ticket)
    }
    return ticket
  })
}

function getNonceStr() {
  return randomBytes(16).toString('hex')
}

function buildSigniture(noncestr, timestamp, url, ticket) {
  const signature = createHash('sha1')
    .update(`jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
    .digest('hex')
  return signature
}

const app = express()

app.use(cors())

app.get('/wechat/sign', (req, res) => {
  const { url } = req.query
  const nonceStr = getNonceStr()
  const timestamp = Math.floor(Date.now() / 1000)

  getTicket()
    .then(ticket => {
      const sig = buildSigniture(nonceStr, timestamp, url, ticket)
      res.json({
        status: 'success',
        sign: {
          appId: config.appID,
          nonceStr,
          timestamp,
          signiture: sig
        }
      })
    })
    .catch(err => {
      logger.error('Failed to get signiture: ', err)
      res.status(500).send('Failed to get signiture')
    })
})

const PORT = process.env.NODE_PORT
app.listen(PORT)

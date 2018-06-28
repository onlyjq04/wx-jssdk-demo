const express = require('express')
const crypto = require('crypto')
const { createHash, randomBytes } = crypto
const config = require('../config')
const cache = require('memory-cache')
const Axios = require('axios')
const co = require('co')
const logger = require('./logger')

const ACCESS_TOKEN_URL = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${
  config.appId
}&secret=${config.appSecret}`

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

function buildSignature(noncestr, timestamp, url, ticket) {
  const signature = createHash('sha1')
    .update(`jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`)
    .digest('hex')

  logger.debug(JSON.stringify({
    timestamp,
    url,
    ticket,
    noncestr
  }, null, 2))
  return signature
}

const app = express()

app.get('/wechat/echo', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query

  const array = [config.token, timestamp, nonce]
  array.sort()

  const tempStr = array.join('')
  const resultCode = createHash('sha1')
    .update(tempStr, 'utf8')
    .digest('hex')

  if (resultCode === signature) {
    res.send(echostr)
  } else {
    res.send('mismatch')
  }
})

app.get('/wechat/sign', (req, res) => {
  let { url } = req.query
  const nonceStr = getNonceStr()
  const timestamp = Math.floor(Date.now() / 1000)

  url = decodeURIComponent(url)

  getTicket()
    .then(ticket => {
      const sig = buildSignature(nonceStr, timestamp, url, ticket)
      res.json({
        status: 'success',
        sign: {
          appId: config.appId,
          nonceStr,
          timestamp,
          signature: sig
        }
      })
    })
    .catch(err => {
      logger.error('Failed to get signature: ', err)
      res.status(500).send('Failed to get signature')
    })
})

const PORT = process.env.NODE_PORT
app.listen(PORT)

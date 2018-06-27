const fs = require('fs')
const winston = require('winston')
require('winston-daily-rotate-file')

const LOG_PATH = require('path').resolve(__dirname, '..', 'logs')

if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH)
}

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug'
    }),

    new winston.transports.DailyRotateFile({
      name: 'info-log',
      filename: `${LOG_PATH}/info.log`,
      level: 'info',
      prepend: true
    }),

    new winston.transports.DailyRotateFile({
      name: 'error-log',
      filename: `${LOG_PATH}/error.log`,
      level: 'error',
      prepend: true
    })
  ]
})

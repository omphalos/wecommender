'use strict'

var assert = require('assert')
  , fs = require('fs')
  , w = require('./wecommender.js')
  , testTimeout = setTimeout(assert.fail.bind(null, 'callback failed'), 2000)

unlinkModel()

w.options = { verbose: true }
w.start()
w.rate(1, 1, 1)
w.rate(1, 1, 1)
w.getRecommendation(1, 1, function(result) {
  console.log('result', result)
  assert.equal(typeof result, 'number')
  clearTimeout(testTimeout)
  w.close()
  unlinkModel()
})

function unlinkModel() {
  if(fs.existsSync('./model.reg'))
    fs.unlinkSync('./model.reg')
}

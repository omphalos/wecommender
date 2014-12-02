'use strict'

var spawn = require('child_process').spawn
  , fs = require('fs')
  , path = require('path')
  , pending = []
  , callbacks = []
  , instance

function start() {

  if(instance)
    throw new Error('An instance is already running')

  var options = exports.options || {}
    , cwd = options.cwd || '.'

  var args = [
    '--quiet',
    '-p', '/dev/stdout',
    '-q', 'ui',
    '--rank', options.rank || '10',
    '-f', 'model.reg',
    '--l2', options.l2 || '0.001',
    '--learning_rate', options.learningRate || '0.015',
    '--initial_t', options.initialT || '1',
    '-b', options.bits || '18',
    '--power_t', options.powerT || '0'
  ]

  if(fs.existsSync(path.join(cwd, 'model.reg')))
    args.push('-i', 'model.reg')

  run(args, options.verbose, cwd)
}
exports.start = start

function getRecommendation(userID, itemID, callback) {
  if(!instance)
    return pending.push(function() {
      getRecommendation(userID, itemID, callback)
    })
  callbacks.push(callback)
  write('|u ' + userID + ' |i ' + itemID)
}
exports.getRecommendation = getRecommendation

function rate(userID, itemID, rating) {
  if(!instance)
    return pending.push(function() {
      rate(userID, itemID, rating)
    })
  callbacks.push(null)
  write(rating + ' |u ' + userID + ' |i ' + itemID)
}
exports.rate = rate

function save(cont) {
  cont && pending.push(cont)
  if(!instance) return
  instance.on('close', function() {
    start()
    while(pending.length)
      pending.shift()()
  })
  instance.stdin.destroy()
  instance = null
}
exports.save = save

function close() {
  if(!instance) return pending.push(close)
  instance.stdin.destroy()
  instance = null
}
exports.close = close

function run(args, verbose, cwd) {

  var log = verbose ? console.log : function() {}

  instance = spawn('vw', args, { cwd: cwd })

  log('running: vw ' + args.join(' '))
  instance.stdin.setEncoding('utf8')
  instance.stderr.setEncoding('utf8')
  instance.stdout.setEncoding('utf8')

  ;['stderr', 'stdout'].forEach(function(key) {

    instance[key].on('data', function(data) {
      log(data.toString().split('\n').map(prefix).join('\n'))
    })

    function prefix(line) {
      var leader = 'vw~' + key
      return line ? leader + ': ' + line : leader
    }
  })

  instance.on('error' ,function(err) {
    throw new Error('vw encountered error: ' + JSON.stringify(err || {}))
  })

  instance.stderr.on('data', function (data) {
    if(!/^execvp\(\)/.test(data)) return
    throw new Error('vw failed to start')
  })

  instance.on('close', function (code) {
    log('vw exited with code ' + code)
  })

  instance.stdout.on('data', function(data) {
    var lines = data.toString().split('\n')
    while(lines.length) {
      var line = lines.shift()
      if(line === '') continue
      var callback = callbacks.shift()
      callback && callback(+line)
    }
  })
}

function write(str) {
  instance.stdin.write(str)
  instance.stdin.write('\n')
}

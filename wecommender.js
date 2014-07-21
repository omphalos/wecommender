'use strict'

var spawn = require('child_process').spawn
  , exists = require('fs').existsSync('./model.reg')
  , pending = []
  , callbacks = []
  , instance

function start() {

  if(instance)
    throw new Error('An instance is already running')

  var options = exports.options || {}

  var args = [
    '/dev/stdin',
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

  if(exists)
    args.push('-i', 'model.reg')

  instance = run('vw', args, options.verbose)

  instance.stdout.on('data', function(data) {
    var lines = data.toString().split('\n')
    while(lines.length) {
      var line = lines.shift()
      if(line === '') continue
      var callback = callbacks.shift()
      callback && callback(+line)
    }
  })

  exists = true
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

function run(name, args, verbose) {

  var proc = spawn(name, args)
    , log = verbose ? console.log : function() {}

  log('running: ' + name + ' ' + args.join(' '))
  proc.stdin.setEncoding = 'utf8'
  proc.stderr.setEncoding('utf8')
  proc.stdout.setEncoding('utf8')

  ;['stderr', 'stdout'].forEach(function(key) {
    proc[key].on('data', function(data) {
      log(data.
        toString().
        split('\n').
        map(function(line) {
          var leader = name + '~' + key
          return line ? leader + ': ' + line : leader
        }).join('\n'))
    })
  })

  proc.stderr.on('data', function (data) {
    if(!/^execvp\(\)/.test(data)) return
    throw new Error(name + ' failed to start')
  })

  proc.on('close', function (code) {
    log(name + ' exited with code ' + code)
  })

  return proc
}

function write(str) {
  instance.stdin.write(str)
  instance.stdin.write('\n')
}

wecommender
===========

Simple NodeJS wrapper for [vowpal wabbit](http://hunch.net/~vw/'s) [matrix factorization functionality](https://github.com/JohnLangford/vowpal_wabbit/wiki/Matrix-factorization-example).
You can use this library like an [online](http://en.wikipedia.org/wiki/Online_machine_learning) recommendation engine.

QuickStart
----------

    npm install wecommender

    node

Then:

    var w = require('wecommender')

    // start the process
    w.start()

    // rate takes (userID, itemID, rating)
    w.rate(1, 1, 1)
    w.rate(1, 2, 0)
    w.rate(2, 1, 1)
    w.rate(2, 2, 1)

    // recommend takes (userID, itemID, callback)
    w.recommend(1, 1, console.log)
    w.recommend(1, 2, console.log)
    w.recommend(2, 1, console.log)
    w.recommend(2, 2, console.log)

    // save learning state
    w.save()

    // terminate (also implicitly saves)
    w.close()

Prerequisites
-------------

The `vw` command must be installed and available, otherwise wecommender
will fail.

Options
-------

It's possible to pass custom parameters to `vw` through the options object.

    var w = require('wecommender')

    w.options = {
      bits: 18, // default is 18 (bits used in the hash function)
      initialT: 0.9, // default is 1 (initial time for learning rate decay)
      l2: 0.002, // default is 0.001 (l2 regularization to prevent overfitting)
      learningRate: 0.1, // default is 0.015
      powerT: 0.1, // default is 0 (learning rate decay)
      rank: 12 // default is 10 (number of latent factors)
    }

I'll refer you to vowpal wabbit's documentation [here](https://github.com/JohnLangford/vowpal_wabbit/wiki/Tutorial) and [here](https://github.com/JohnLangford/vowpal_wabbit/wiki/Matrix-factorization-example) for explanations of
these parameters.

Additionally, wecommender's verbose logging can be toggled in a similar way:

    w.options = {
      verbose: true
    }

License
-------

MIT

'use strict';

var watson = require('watson-developer-cloud');
var config = require('./config.js')();

var tone_analyzer = watson.tone_analyzer({
  username: config.credentials.username,
  password: config.credentials.password,
  version: 'v2-experimental'
});

module.exports = function(text, cb) {
  tone_analyzer.tone(text, function(err, data) {
    if (err) console.log(err);
    cb(data);
  })
}

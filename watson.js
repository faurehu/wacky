'use strict';

var watson = require('watson-developer-cloud');
var config = require('./config.js')();

var personality_insights = watson.personality_insights({
  username: config.credentials.username,
  password: config.credentials.password,
  version: 'v2'
});

module.exports = function watson(text, cb) {
  personality_insights.profile({
    text: text},
    function (err, response) {
      if (err)
        console.log('error:', err);
      else
        var traits = response.tree.children[0].children[0].children;
        cb({
          openness: traits[0].percentage,
          conscientiousness: traits[1].percentage,
          extraversion: traits[2].percentage,
          agreeableness: traits[3].percentage,
          emotional_range: traits[4].percentage,
        });
  });
}

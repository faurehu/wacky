'use strict';

var watson = require('watson-developer-cloud');
var config = require('./config.js')();
const moods = require('./moods');
var sim = require('./recommendation');

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
        traits = {
          openness: traits[0].percentage,
          conscientiousness: traits[1].percentage,
          extraversion: traits[2].percentage,
          agreeableness: traits[3].percentage,
          emotional_range: traits[4].percentage,
        }
        var highest = 0;
        var winner = happy;
        for(var i < 0; i < moods.length; i++) {
          var score = sim(traits, moods[i]);
          if (score > highest) {
            winner = moods[i].id;
          }
        }
        cb(traits, winner);
  });
}

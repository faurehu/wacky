'use strict';

const Hapi = require('hapi');
const request = require('request');
const config = require('./config')();
const mongoose = require('mongoose');
const humm = require('humm');
const findOneOrCreate = require('mongoose-find-one-or-create');
const watson = require('./watson');
// const watson = require('./tone');

var teamSchema = mongoose.Schema({ name: String, token: String, id: String });
teamSchema.plugin(findOneOrCreate);
var teamModel = mongoose.model('team', teamSchema);

mongoose.connect(config.path);

// Create a server with a host and port
const server = new Hapi.Server();

var port = parseInt(process.env.PORT) || 8000;

server.connection({
    host: '0.0.0.0',
    port: port
});

server.register(require('inert'), function (err) {

    if (err) {
        throw err;
    }

    // Add the route
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.file('./index.html');
        }
    });

    server.route({
        method: 'GET',
        path:'/callback',
        handler: function (req, reply) {
          var code = req.query.code;
          var options = {
            url: 'https://slack.com/api/oauth.access',
            form: {
              'client_id': config.slackClient,
              'client_secret': config.slackSecret,
              'code': code ,
              'redirect_uri': config.callback
            }
          }
          request.post(options, function(err, httpResponse, body) {
            if(err) console.log(err);
            console.log(body);
            var data = JSON.parse(body);
            var team = {
              token: data.access_token,
              name: data.team_name,
              id: data.team_id
            }
            teamModel.findOneOrCreate({id: data.team_id}, team, function(err, team) {
                reply.file('./success.html');
            });
          });
        }
    });

    server.route({
      method: 'POST',
      path: '/',
      handler: function(req, reply) {
        var params = req.payload;
        var team_id = params.team_id;
        var channel_id = params.channel_id;
        var user_id = params.user_id;
        var callback_url = params.response_url;

        reply({"response_type": "in_channel"});

        var finish = function(traits, winner) {

          var path = "https://api.myhumm.com/v2/radio?auth=5663cd50ae8c50e2638b456b&limit=1&moods=" + winner;
          request.get({url: path, "rejectUnauthorized": false}, function(err, httpResponse, body) {
            if (err) console.log("humm", err);
            var data = JSON.parse(body).data_response[0].urls.youtube;
            pushJSON(data, function() {console.log('done')});
          });
        }

        var pushJSON = function(text, cb) {
          var options = {
            url: callback_url,

            form: {
              "response_type": "in_channel",
              text: text
            }
          }
          request.post(options, function(err, httpResponse, body) {
            if(err) console.log(err);
            console.log(httpResponse);
            cb();
          });
        }

        pushJSON("Got you! Currently analyzing your chat history!", function() {
          teamModel.find({id: team_id}, function(err, docs) {
            if(err) console.log(err);
            var token = docs[0].token;
            var options = {
              url: 'https://slack.com/api/channels.history?token=' + token + '&channel=' + channel_id + '&pretty=1'
            }

            request.post(options, function(err, httpResponse, body) {
              if(err) next(err);
              var data = JSON.parse(body).messages;
              var messages = data.map(function(message) {
                if(message.user == user_id) {
                  return message.text;
                }
              });
              var messages = messages.slice(0, messages.length -1);
              var text = messages.join(" ");
              watson(text, finish, pushJSON);
            });
          });
        });
      }
    });

    server.start(function (err) {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
});

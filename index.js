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
            return reply.file('./index.html');
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

        var finish = function(traits, winner) {

          humm.init({
            client_id: '5663cd50ae8c50e2638b456b',
            client_secret: config.humm
          });

          humm.accessViaCodeGrant(code, function(authErr, authRes) {
            console.log('------------- accessViaCodeGrant complete -------------');
            console.log('authErr');
            console.log(authErr);
            console.log('AuthRes');
            console.log(authRes);

               if(!authErr && authRes) {
                   /** Sample auth res:
                    * { access_token: '565b0c78015f91c91a9882ea',
                        expires_in: 2592000,
                        token_type: 'Bearer',
                        refresh_token: 'c4be4384dea6c19c7cc37206d2b6aac4c4be4384dea6c19c7cc37206d2b6aac4',
                        scope: null }
                    *
                    */
                   //set token before request
                   humm.setAccessToken(authRes.access_token);
                   //get current user
                   humm.users.me(function(meErr, meRes){
                       console.log('--------------------- users.me()----------');
                       console.log(meErr);
                       console.log(meRes);

                       //send response back
                       res.send({ auth: authRes,  me: meRes });
                   });
               }else {
                   console.log(authErr);
                   console.log(authRes);
                 //  throw new Error('Authorization attempt failed');
               }
          });

          var path = "https://api.myhumm.com/v2/radio?auth=5663cd50ae8c50e2638b456b&limit=1&moods=" + winner;
          request.get({url: path, "rejectUnauthorized": false}, function(err, httpResponse, body) {
            if (err) console.log("humm", err);
            console.log(JSON.parse(body));
            var data = JSON.parse(body).data_response[0].urls.youtube;
            reply(data);
          });
        }

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
            watson(text, finish);
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

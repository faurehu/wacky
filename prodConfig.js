module.exports = {
  slackClient: process.env.SLACK_CLIENT,
  slackSecret: process.env.SLACK_SECRET,
  "credentials": {
    "url": process.env.IBM_URL,
    "username": process.env.IBM_USER,
    "password": process.env.IBM_PW
  },
  path: process.env.MONGOLAB_URI,
  callback: 'http://slackhumm.herokuapp.com/callback',
  humm: '9a79fb40556d2983eaa4d070dbb5d883bc5c6f6961b965237daf36a46ec835f3'
}

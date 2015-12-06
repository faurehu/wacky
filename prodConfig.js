module.exports = {
  slackClient: process.env.SLACK_CLIENT,
  slackSecret: process.env.SLACK_SECRET,
  "credentials": {
    "url": process.env.IBM_URL,
    "username": process.env.IBM_USER,
    "password": process.env.IBM_PW
  },
  path: process.env.MONGOLAB_URI,
  callback: 'http://slackhumm.herokuapp.com/callback'
}

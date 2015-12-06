module.exports = function() {
  switch(process.env.NODE_ENV){
    case 'development':
      return require('./devConfig');

    case 'production':
      return require('./prodConfig');

    default:
      return require('./devSettings');
  }
}

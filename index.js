const Promise = require('bluebird');
const debug = require('debug')('trellis-service-signatures')

const getUnsignedDocs = require('./src/getUnsignedDocs.js')
const sign= require('./src/sign.js')
const tokens = require('./src/tokens.js')
const config = require('./config.js')


function run() {
  //Load tokens
  return Promise.map(tokens.getAll(), (token) => {
    return getUnsignedDocs({token}).then((unsignedDocs) => {
      //Check if it has a signature
      debug(unsignedDocs.length, 'docs need signatures.');
      return Promise.map(unsignedDocs, (doc) => {
        return sign({doc, token});
      });
    });
  });
}

run();
setInterval(() => {
  run()
}, config.interval*1000);

const Promise = require('bluebird');
const debug = require('debug')('trellis-signature-service')

const getUnsignedAudits = require('./src/getUnsignedAudits.js')
const signAudit = require('./src/signAudit.js')
const tokens = require('./src/tokens.js')
const config = require('./config.js')


function run() {
  //Load tokens
  return Promise.map(tokens.getAll(), (token) => {
    return getUnsignedAudits({token}).then((unsignedAudits) => {
      //Check if it has a signature
      debug(unsignedAudits.length, 'audits need signatures.');
      return Promise.map(unsignedAudits, (unsignedAudit) => {
        return signAudit({audit: unsignedAudit, token});
      });
    });
  });
}

run();
setInterval(() => {
  run()
}, config.interval*1000);

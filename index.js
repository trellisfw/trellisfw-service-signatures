const getUnsignedAudits = require('./src/getUnsignedAudits.js')
const signAudit = require('./src/signAudit.js')
const Promise = require('bluebird');
const debug = require('debug')('trellis-signature-service')

const INTERVAL = 30; //Seconds

function run() {
  debug('Retrieving audits...');
  return getUnsignedAudits().then((unsignedAudits) => {
    //Check if it has a signature
    debug(unsignedAudits.length, 'audits need signatures.');
    return Promise.map(unsignedAudits, (unsignedAudit) => {
      return signAudit(unsignedAudit);
    });
  });
}

run();
setInterval(() => {
  run()
}, INTERVAL*1000);

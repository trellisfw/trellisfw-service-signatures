const tsig = require('@trellisfw/signatures');
const _ = require('lodash');
const Promise = require('bluebird');
const axios = require('axios');
const debug = require('debug')('trellis-signature-service:sign')

const jwkKeys = require('./jwkKeys.js');
const config = require('../config.js')

function sign({doc, token}) {
  return Promise.join(jwkKeys.public(), jwkKeys.private(), jwkKeys.info(), (pubJwk, prvJwk, {kid, alg, kty, typ, jku}) => {
    var headers = { kid, alg, kty, typ, jku };
    if (jku) headers.jku = jku;
    if (pubJwk) headers.jwk = pubJwk;
    //Remove _id, _rev, and _meta from the doc when signing/verifying
    return tsig.generate(_.omit(doc, ['_id', '_rev', '_meta']), prvJwk, headers).then((signatures) => {
      debug('Signing doc:', doc._id);
      return axios({
        method: 'PUT',
        url: config.api+'/'+doc._id+'/signatures',
        headers: {
          Authorization: 'Bearer '+token
        },
        data: signatures
      });
    }).catch((error) => {
      debug('Failed to sign doc', doc._id)
      throw error;
    });
  });
}

module.exports = sign;

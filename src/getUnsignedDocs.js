const axios = require('axios');
const debug = require('debug')('trellis-signature-service:getUnsignedDocs')
const config = require('../config.js')
const _ = require('lodash');
const Promise = require('bluebird');

function getUnsignedDocs({token}) {
  /*
    Get /bookmarks/certifications
  */
  var docs = [];
  return axios({
    method: 'GET',
    url: config.api+'/bookmarks/certifications',
    headers: {
      Authorization: 'Bearer '+token
    }
  }).then((response) => {
    //Extract only list of certification ids
    var certKeys = _.filter(Object.keys(response.data), key=>(_.startsWith(key, '_')===false));
    return Promise.map(certKeys, (key) => {
      return Promise.join(
        //Add certification to list if it isn't signed.
        axios({
          method: 'GET',
          url: config.api+'/bookmarks/certifications/'+key,
          headers: {
            Authorization: 'Bearer '+token
          }
        }).then((response) => {
          var signatures = _.get(response, 'data.signatures');
          if (signatures == null || (_.isArray(signatures) && signatures.length == 0)) {
            docs.push(response.data);
          }
        }).catch((err) => {
          debug('Failed to load certification', key);
        }),
        //Add audit to list if it isn't signed.
        axios({
          method: 'GET',
          url: config.api+'/bookmarks/certifications/'+key+'/audit',
          headers: {
            Authorization: 'Bearer '+token
          }
        }).then((response) => {
          var signatures = _.get(response, 'data.signatures');
          if (signatures == null || (_.isArray(signatures) && signatures.length == 0)) {
            docs.push(response.data);
          }
        }).catch((err) => {
          debug('Failed to load audit', key);
        }),
      );
    }, {concurrency: 5});
  }).then(() => {
    return docs;
  }).catch((error) => {
    if (error.response.status == 404) {
      debug('Certifications resource does not exist.')
      return [];
    } else {
      throw error;
    }
  })
}

module.exports = getUnsignedDocs;

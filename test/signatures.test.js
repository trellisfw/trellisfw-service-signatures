var mocha = require('mocha');
var _ = require('lodash');
//var randCert = require('@trellisfw/random-cert')
var Promise = require('bluebird');
var axios = require('axios');
var {expect}= require('chai');
var pgfsTemplate = require('./pgfsTemplate');
var makeCertification = require('./makeCertification');
var {token, gln} = require('./config.js');

async function cleanUp(result) {
  return
  await oadaRequest({
    method: 'delete',
    url: 'https://api.trellis.one/bookmarks/certifications',
  })
  await oadaRequest({
    method: 'delete',
    url: 'https://api.trellis.one/'+result.certifications_id,
  })
  await oadaRequest({
    method: 'delete',
    url: 'https://api.trellis.one/'+result.certification_id
  })
  await oadaRequest({
    method: 'delete',
    url: 'https://api.trellis.one/'+result.certificate_id
  })
  await oadaRequest({
    method: 'delete',
    url: 'https://api.trellis.one/'+result.audit_id
  })
}

function getCertificate(audit) {
  var certificate = _.cloneDeep(audit);
  certificate.certificate_validity_period = {
    start: "2016-04-11",
    end: "2017-04-11"
  }
  delete certificate.sections;
  delete certificate.control_points;
  return certificate
}

function oadaRequest({method, url, data, type}) {
  var request = {
    method,
    url,
    headers: {
      'Authorization': 'Bearer '+token,
    }
  }
  if (type) request.headers['Content-Type'] = type;
  if (data) request.data = data;
  return axios(request);
}

describe('Trellis Signatures Service', () => {

  describe('Make a certification comprised of audit and certificate without signatures', async function() {
    var result;
    before(`Create the certification`, async function() {
      this.timeout(5000);
      var audit = pgfsTemplate;
      var certificate = getCertificate(pgfsTemplate);
      certificate.organization.GLN = gln;
      result = await makeCertification(audit, certificate)
    })

    it('Should now have a signature on the audit and certificate', async function() {
      this.timeout(65000)
      this.retries(7);
      await Promise.delay(5000)

      var certificationId = result.certification_id.replace(/^resources\//, '');
      var audit = await oadaRequest({
        method: 'get',
        url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/audit',
      })
      expect(audit.data).to.include.key('signatures');

      var certificate = await oadaRequest({
        method: 'get',
        url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/certificate',
      })
      expect(certificate.data).to.include.keys('signatures');
    })

    after(`Clean up`, async function() {
      await cleanUp(result)
    })
  })

  describe(`Certifications that already have docs with signatures should not be signed`, function() {
    var result;
    var auditSig = ['auditsig'];
    var certSig = ['certsig'];

    before(`Create certification with docs that already have signatures`, async function() {
      var audit = pgfsTemplate;
      var certificate = getCertificate(audit);
      audit.signatures = auditSig;
      certificate.signatures = certSig;
      result = await makeCertification(audit, certificate)
    })

    it(`Shouldn't get a new signature`, async function() {
      console.log(result)
      this.timeout(65000)
      this.retries(7);
      await Promise.delay(5000)
      var certificationId = result.certification_id.replace(/^resources\//, '');
      var auditResponse = await oadaRequest({
        method: 'get',
        url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/audit/signatures',
      })
      expect(auditResponse.data[0]).to.equal(auditSig[0])
      expect(auditResponse.data.length).to.equal(auditSig.length)

      var certResponse = await oadaRequest({
        method: 'get',
        url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/certificate/signatures',
      })
      expect(certResponse.data[0]).to.equal(certSig[0])
      expect(certResponse.data.length).to.equal(certSig.length)
    })

    after(`Clean up`, async function() {
      await cleanUp(result)
    })
  })
})

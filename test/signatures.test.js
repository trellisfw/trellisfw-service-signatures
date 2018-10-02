var mocha = require('mocha');
var _ = require('lodash');
//var randCert = require('@trellisfw/random-cert')
var Promise = require('bluebird');
var axios = require('axios');
var {expect}= require('chai');
var pgfsTemplate = require('./pgfsTemplate');
var makeCertification = require('./makeCertification');
var {token, gln} = require('./config.js');

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

  it('Make a certification comprised of audit and certificate without signatures', async function() {
    this.timeout(5000);
    var audit = pgfsTemplate;
    var certificate = getCertificate(pgfsTemplate);
    certificate.organization.GLN = gln;
    result = await makeCertification(audit, certificate)
    certificationId = result.certification_id.replace(/^resources\//, '');
    console.log(result)
  })

  it('Should now have a signature on the audit and certificate', async function() {
    this.timeout(65000)
    this.retries(7);
    await Promise.delay(5000)

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

  it(`Create certification with audits with signatures`, async function() {
    var auditSig = ['auditsig'];
    var certSig = ['certsig'];
    var audit = pgfsTemplate;
    var certificate = getCertificate(audit);
    audit.signatures = auditSig;
    certificate.signatures = certSig;
    var result = await makeCertification(audit, certificate)
    certificationId = result.certification_id.replace(/^resources\//, '');

    this.timeout(65000)
    this.retries(7);
    await Promise.delay(5000)
    var auditResponse = await oadaRequest({
      method: 'get',
      url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/audit/signatures',
    })
    expect(auditResponse.data).to.equal(auditSig)

    var certificateResponse = await oadaRequest({
      method: 'get',
      url: 'https://api.trellis.one/bookmarks/certifications/'+certificationId+'/audit/signatures',
    })
    expect(certificateResponse.data).to.equal(certificateSig)
  })

  it('Now clean up', async function() {
    await oadaRequest({
      method: 'delete',
      url: 'https://api.trellis.one/bookmarks/certifications',
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
  })

})

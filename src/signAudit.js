const fsig = require('fpad-signatures');
const _ = require('lodash');
const debug = require('debug')('trellis-signature-service:signAudit')
const config = require('../config.js')
const Promise = require('bluebird');
const axios = require('axios');

const pubJwk = {
  kty: 'RSA',
  n: 'nrNguIQlBwNqNkKO1h0BhePImG_SXMknYaDC_ltwjHpdt139t1J2nkMLDKrqRcF2vlTG61dRYrYgPW55G8oU3Uuf4J0p2Lf5u6ZRvdSw1ep5gfLwWGWy22F-hx1DAKf3E6keTIBfcNejihEPQv9H9Fzy1-GJUzMYfrPi9E2kiaOTuFzGLkOKX5qnVBZZGYube4soOV6c18uz83UFBDs_3sYp89GrakH5jvwMHqV4e1qBv6p2BCXPoVYW6rUJjAAyQM9wN2h8jfkZtYTtV6KGeTj4EaAHr2fQacZFN77IIzRTL8flRLgDKns3QMdrbky43bvCRvjd_4rKCJ9onbDixw',
  e: 'AQAB'
}

const prvJwk = {
  kty: 'RSA',
  n: 'nrNguIQlBwNqNkKO1h0BhePImG_SXMknYaDC_ltwjHpdt139t1J2nkMLDKrqRcF2vlTG61dRYrYgPW55G8oU3Uuf4J0p2Lf5u6ZRvdSw1ep5gfLwWGWy22F-hx1DAKf3E6keTIBfcNejihEPQv9H9Fzy1-GJUzMYfrPi9E2kiaOTuFzGLkOKX5qnVBZZGYube4soOV6c18uz83UFBDs_3sYp89GrakH5jvwMHqV4e1qBv6p2BCXPoVYW6rUJjAAyQM9wN2h8jfkZtYTtV6KGeTj4EaAHr2fQacZFN77IIzRTL8flRLgDKns3QMdrbky43bvCRvjd_4rKCJ9onbDixw',
  e: 'AQAB',
  d: 'jd73uRvQ6hsgaQ9JF5nokaPW4IcefHoKrZkEmFRwIfUGMHVi6e5bQhHXH-Tu95sCpxWsmhh-FguQeLp4o-IcktQXQbnd_fJB24HMkzI_P4yUQRpHyA5qPPpEHU-IZV7CXx4Rivw71enANh4YEaGa1pX9NgZWOD12SVZQrmt2it93A7jGFNiJYlRZSqXmiSRdg39v5G9hnxDUWdbN_bTrc8DJ6ZH15_nBxxZIWcZZavqXzabFsKTLWKhxsB1pVs9f9xKcuv_MzAbjOwe8y225_HCLUtevV0uMrHPl-x3gPN_hdSj9ZhGcMr8S6V_f6ONu1uvIpgj5rXGdwPUsfoPW4Q',
  p: '6uejaQUI_x2rDYjvucph3CgQ6MrB_2RsQ1HAu3fSIkvkN7gtFDgP4HvD4nchUZJ6_f4sXirKrWBOEYI4vyXoanBD9ZCSmLkzjBtwEGunndMSCtX8rXL9-MSZXSxS6_7auzUvoeMk-KrJ_zAf62K_13RT5polAQSedw-bf5wl6zc',
  q: 'rPPWwAhw7BnWaoy-a5zXYwhaCtcqaEegiBkCo4h90n0OOFzuTZzgN7g0karXv_B2hyidwybf2c35BNVSg_rjAX7QWmbPbIQz24DAUSJYEhFFDlAzhXJej23oFpJc7pLtAQgrSJ_XOP1NmCQl27Br4xesrkNRNb8D2ndZPdV3LPE',
 dp: 'UNRqJ14DLX3w-RRQoRahu9bRkrkKLi5JDpUYA6oEVabVndKzOEzeMbmEuu2ROndz-Og4LiL9YNFNq7qqeiO6KL3-tIYN252GvkRGuG_C2ozhnXbqnmh-Oda0ixoQYoJsk5SGkmcNtr9WCIhvw1hUePffUu9hoksLmB53vF5nsds',
 dq: 'ZjILMhuKxigaR4l0t1fM-aqksgUj_MxeMi09Hu53EppsfaeD9H5_Cs2g2nYt2C-5ifHZDsh4u1V3EIEQqgXkfyy05sYbSM7xaYGxof9-NObZfDStzOugrnXODxBbM2nD-7kdAmPYo8chQ4YQjLi5d0207p--a9i76SpepCfvrLE',
 qi: 'YlE9wO5yPCG12gp76BeivZtK4y-E6HO--o3s2uNs1nbXcBHzdoPOp0hfwI3FlIn3WHlLiy1uJ0pH1Nel8WJBs4E1IDUAFx1PLFNzWGC2JhhztFjXc5LFIo-JySJXElzJ5DhvRdQawKtSqtVuANKgg3CBSmadtH82OBdtaKv9mkQ'
}

function signAudit(audit) {
  var kid = 'SignatureService'
  var alg = 'RS256'
  var kty = 'RSA'
  var typ = 'JWT'
  var jku = 'https://raw.githubusercontent.com/fpad/trusted-list/master/jku-test/some-other-jku-not-trusted.json'
  var headers = { kid, alg, kty, typ, jwk:pubJwk, jku }
  return fsig.generate(audit, prvJwk, headers).then((signatures) => {
    debug('Signing audit:', audit._id);
    return axios({
      method: 'PUT',
      url: config.api+'/'+audit._id+'/signatures',
      headers: {
        Authorization: 'Bearer '+config.token
      },
      data: signatures
    }).catch((error) => {
      debug('Failed to sign audit', audit._id)
      throw error;
    });
  });
}

module.exports = signAudit;

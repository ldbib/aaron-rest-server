
'use strict';

var crypto  = require('crypto');
var util    = require('util');

var hmacLog = util.debuglog('hmac');

var config  = require('../config');

function hmacUser(user, expiry) {
  var dynamic_key, data_enc, encrypted, finalOutput;
  dynamic_key = crypto.createHmac('sha512', config.cookie.spk).update(user+'|'+expiry).digest('hex');
  data_enc = crypto.createHmac('sha512', dynamic_key).update(config.cookie.sfp).digest('hex');
  encrypted = crypto.createHmac('sha512', dynamic_key).update(user+'|'+expiry+'|'+config.cookie.sfp).digest('hex');
  finalOutput = user+'|'+expiry+'|'+data_enc+encrypted;
  return finalOutput;
}

function validateHmacUser(hmac) {
  if(!hmac) {
    hmacLog('no hmac provided');
    return false;
  }
  hmacLog('parsing hmac');
  var parts = hmac.split('|');
  var dynamic_key = crypto.createHmac('sha512', config.cookie.spk).update(parts[0]+'|'+parts[1]).digest('hex');
  var data_enc = crypto.createHmac('sha512', dynamic_key).update(config.cookie.sfp).digest('hex');
  var encrypted = crypto.createHmac('sha512', dynamic_key).update(parts[0]+'|'+parts[1]+'|'+config.cookie.sfp).digest('hex');
  var finalOutput = parts[0]+'|'+parts[1]+'|'+data_enc+encrypted;
  if(hmac === finalOutput) {
    hmacLog('hmac valid, checking time');
    if(parts[1] > Math.floor(Date.now()/1000)) {
      hmacLog('hmac completely valid');
      return parts[0];
    }
  }
  hmacLog('hmac invalid');
  return false;
}

module.exports.user = hmacUser;
module.exports.validateUser = validateHmacUser;

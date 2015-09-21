
/*

This file is part of Aaron Rest Server.

Aaron Rest Server is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Aaron Rest Server is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Aaron Rest Server.  If not, see <http://www.gnu.org/licenses/>.

*/

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

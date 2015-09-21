
'use strict';

var textBody = require('body');
var qs       = require('querystring');

function queryBody(req, cb) {
  textBody(req, function(err, body) {
    if(err) {
      return cb(null, err);
    }
    body = qs.parse(body);
    cb(body, null);
  });
}

module.exports.query = queryBody;

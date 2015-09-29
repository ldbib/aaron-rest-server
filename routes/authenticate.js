
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

var bcrypt    = require('bcrypt');
var util      = require('util');
var authLog   = util.debuglog('auth');

var config    = require('../config');

var hmac      = require('../common/hmac');

var pool = null;

// Function to validate the user information provided via cookie or auth key.
function checkAuth(req, res, next) {
  authLog('checking auth');
  if(req.cookie && req.cookie.auth) {
    authLog('auth cookie present');
    req.authUser = hmac.validateUser(req.cookie.auth);
    if(req.authUser !== false) {
      authLog('auth cookie valid');
      return next();
    }
    authLog('auth cookie invalid');
  } else {
    authLog('auth cookie not present, checking arg');
    if(req.params && req.params.application_shortname &&
      req.params.application_shortname.length > 0 &&
      req.params.application_apikey &&
      req.params.application_apikey.length > 0) {

      // Validate external application via application name, key and an optional IP restriction.
      authLog('auth arguments avaliable. check ip then validity');
      pool.getConnection(function(err, connection) {
        if(err) {
          console.error(err);
          return res.send(500, new Error('mysql'));
        }
        connection.query('SELECT application_shortname, application_name, application_apikey, application_ipv4, application_ipv6 FROM applications WHERE application_shortname = ?;', [req.params.application_shortname], function(err, rows) {
          connection.release();
          if(err) {
            console.error(err);
            return res.send(500, new Error('mysql'));
          }
          // TODO: FIX IP VALIDATION
          console.log(req.connection.remoteAddress);
          if(rows.length === 0) {
            console.error('AUTH: application does not exist!');
            return res.send(400, new Error('invalid-credentials'));
          }
          if(rows[0].application_apikey === req.params.application_apikey) {
            return next();
          }
          console.error('AUTH: invalid apikey for appication', rows[0].application_shortname);
          return res.send(400, new Error('invalid-credentials'));
        });
      });
      // Stop further processing to ensure that the query can finish to validate the application and key.
      return;
    }
  }
  
  res.send(403, new Error('authenticate-first'));
}

function authenticate(req, res, next) {
  authLog('auth request received!');
  if(!req.params.u || !req.params.p) {
    console.error('AUTH: parameters are missing!');
    return res.send(400, new Error('missing-parameters'));
  }
  pool.getConnection(function(err, connection) {
    if(err) {
      console.error(err);
      return res.send(500, new Error('mysql'));
    }
    connection.query('SELECT user_password, user_email FROM users WHERE user_email = ? || user_pemail = ? LIMIT 1;', [req.params.u, req.params.u], function(err, rows) {
      connection.release();
      if(err) {
        console.error(err);
        return res.send(500, new Error('mysql'));
      }
      if(rows.length === 0) {
        authLog('no user with that e-mail!');
        return res.send(400, new Error('invalid-credentials'));
      }
      bcrypt.compare(req.params.p, rows[0].user_password, function(err, result) {
        if(err) {
          console.error(err);
          return res.send(400, new Error('validation'));
        }
        if(result === true) {
          authLog('logging in user with email:', rows[0].user_email);
          var d = new Date(Date.now()+config.cookie.authTime*1000).toUTCString();
          res.header('Set-Cookie', 'auth='+hmac.user(rows[0].user_email, Math.floor(Date.now()/1000) + config.cookie.authTime)+'; Expires='+d+'; domain='+config.http.domain+'; path=/; HttpOnly');
          res.send(200, {auth: true});
          return next();
        }
        authLog('invalid password!');
        res.send(400, new Error('invalid-credentials'));
      });
    });
  });
}

function deAuthenticate(req, res) {
  var d = new Date(0).toUTCString();
  res.header('Set-Cookie', 'auth=null; Expires='+d+'; domain='+config.http.domain+'; path=/; HttpOnly');
  res.send(200, {deauth: true});
}

function activateRoute(server, mysqlPool) { // I know auth already! :)
  pool = mysqlPool;

  server.post('/authenticate', authenticate);
  server.post('/deauthenticate', deAuthenticate);
}

module.exports.activateRoute = activateRoute;
module.exports.checkAuth     = checkAuth;

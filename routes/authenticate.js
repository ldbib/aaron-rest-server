
'use strict';

var bcrypt    = require('bcrypt');
var util      = require('util');
var authLog   = util.debuglog('auth');

var config    = require('../config');

var hmac      = require('../common/hmac');
var queryBody = require('../common/querybody');

var pool = null;

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
    authLog('auth cookie not present');
  }
  
  res.send(403, new Error('authenticate-first'));
}

function authenticate(req, res, next) {
  authLog('auth request received!');
  queryBody.query(req, function(body, err) {
    if(err) {
      console.error(err);
      return res.send(400, new Error('invalid-body'));
    }
    authLog('body was', body);
    if(!body.u || !body.p) {
      console.error('AUTH: parameters are missing!');
      return res.send(400, new Error('missing-parameters'));
    }
    pool.getConnection(function(err, connection) {
      if(err) {
        console.error(err);
        return res.send(500, new Error('mysql'));
      }
      connection.query('SELECT user_password, user_email FROM users WHERE user_email = ? || user_pemail = ? LIMIT 1;', [body.u, body.u], function(err, rows) {
        connection.release();
        if(err) {
          console.error(err);
          return res.send(500, new Error('mysql'));
        }
        if(rows.length === 0) {
          authLog('no user with that e-mail!');
          return res.send(400, new Error('invalid-credentials'));
        }
        bcrypt.compare(body.p, rows[0].user_password, function(err, result) {
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

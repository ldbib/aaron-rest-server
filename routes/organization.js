
'use strict';

var bcrypt    = require('bcrypt');
var util      = require('util');
var orgLog    = util.debuglog('org');

var config    = require('../config');

var queryBody = require('../common/querybody');

var pool = null;


function updateOrganization(req, res, next) {
  userLog('update request received!');
  queryBody.query(req, function(body, err) {
    if(err) {
      console.error(err);
      return res.send(400, new Error('invalid-body'));
    }
    pool.getConnection(function(err, connection) {
      var updatedPassword = false;
      if(err) {
        console.error(err);
        return res.send(500, new Error('mysql'));
      }
      var post = {};
      if(typeof req.params.shortname !== 'string') {
        console.error('updateOrganization: invalid-input-data');
        return res.send(400, new Error('invalid-input-data'));
      }
      if(typeof body.organization_shortname === 'string') {
        if(body.organization_shortname.length > 0  && body.organization_shortname.length < 256) {
          post.organization_shortname = body.organization_shortname;
        } else {
          console.error('updateOrganization: invalid-input-data, shortname');
          return res.send(400, new Error('invalid-input-data, shortname'));
        }
      }
      if(typeof body.organization_name === 'string') {
        if(body.organization_name.length > 0  && body.organization_name.length < 256) {
          post.organization_name = body.organization_name;
        } else {
          console.error('updateOrganization: invalid-input-data, name');
          return res.send(400, new Error('invalid-input-data, name'));
        }
      }
      if(Object.keys(post).length === 0) {
        console.error('updateOrganization: invalid-input-data');
        return res.send(400, new Error('no-data-inputted'));
      }
      function storeData() {
        var query = connection.query('UPDATE users SET ? WHERE user_email = ? OR user_pemail = ?;', [post, req.params.email, req.params.email], function(err, results) {
          connection.release();
          if(err) {
            console.error(err, query.sql);
            return res.send(500, new Error('mysql'));
          }
          console.log(results);
          res.send(200, {message: 'success'});
          return next();
        });
      }
      if(updatedPassword) {
        bcrypt.genSalt(11, function(err, salt) {
          if(err) {
            console.error(err);
            return res.send(500, new Error('crypto'));
          }
          bcrypt.hash(post.user_password, salt, function(err, hash) {
            if(err) {
              console.error(err);
              return res.send(500, new Error('crypto'));
            }
            post.user_password = hash;
            storeData();
          });
        });
      } else {
        storeData();
      }
    });
  });
}


function activateRoute(server, mysqlPool, checkAuth) {
  pool = mysqlPool;
  server.put('/organization/:shortname', checkAuth, updateOrganization);
}

module.exports.activateRoute = activateRoute;
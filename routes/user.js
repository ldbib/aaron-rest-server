
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
var userLog   = util.debuglog('user');

var config    = require('../config');

var queryBody = require('../common/querybody');

var pool = null;


function updateUser(req, res, next) {
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
      if(typeof req.params.email !== 'string') {
        console.error('updateUser: invalid-input-data');
        return res.send(400, new Error('invalid-input-data'));
      } else if(!config.r.email.test(req.params.email)) {
        console.error('updateUser: invalid-input-formatting');
        return res.send(400, new Error('invalid-input-formatting'));
      }
      if(typeof body.user_firstName === 'string') {
        post.user_firstName = body.user_firstName;
      }
      if(typeof body.user_lastName === 'string') {
        post.user_lastName = body.user_lastName;
      }
      if(typeof body.user_workplace === 'string') {
        post.user_workplace = body.user_workplace;
      }
      if(typeof body.user_place === 'string') {
        post.user_place = body.user_place;
      }
      if(typeof body.user_email === 'string') {
        post.user_email = body.user_email;
      }
      if(typeof body.user_pemail === 'string') {
        post.user_pemail = body.user_pemail;
      }
      if(typeof body.user_phonenumber === 'string') {
        post.user_phonenumber = body.user_phonenumber;
      }
      if(typeof body.user_password === 'string') {
        // TODO check wheter the user's current password correct before changing.
        post.user_password = body.user_password;
        updatedPassword = true;
      }
      if(body.user_admin === '0' || body.user_admin === '1') {
        // TODO check permissions
        post.user_admin = parseInt(body.user_admin);
      }
      if(body.user_activated === '0' || body.user_activated === '1') {
        // TODO check permissions
        post.user_activated = parseInt(body.user_activated);
      }
      if(typeof body.workplaces_workplace_id === 'string') {
        // TODO check permissions
        post.workplaces_workplace_id = body.workplaces_workplace_id;
      }
      if(Object.keys(post).length === 0) {
        console.error('updateUser: invalid-input-data');
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
  server.put('/user/:email', checkAuth, updateUser);
}

module.exports.activateRoute = activateRoute;
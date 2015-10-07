
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

var util          = require('util');
var permissionLog = util.debuglog('permission');

var config        = require('../config');

var pool = null;


function updatePermissions(req, res) {
  permissionLog('update request!');
  pool.getConnection(function(err, connection) {
    if(err) {
      console.error(err);
      return res.send(500, new Error('mysql'));
    }
    var post = {};
    if(typeof req.params.email !== 'string') {
      console.error('updatePermissions: invalid-input-data');
      return res.send(400, new Error('invalid-input-data'));
    } else if(!config.r.email.test(req.params.email)) {
      console.error('updatePermissions: invalid-input-formatting');
      return res.send(400, new Error('invalid-input-formatting'));
    }
    /*if(Object.keys(post).length === 0) {
      console.error('updatePermissions: invalid-input-data');
      return res.send(400, new Error('no-data-inputted'));
    }*/

    return res.send(500, new Error('not implemented yet!'));

    // TODO - not implemented yet!
    var query = connection.query(';', [], function(err, results) {
      connection.release();
      if(err) {
        console.error(err, query.sql);
        return res.send(500, new Error('mysql'));
      }
      console.log(results);
      res.send(200, {message: 'success'});
    });
  });
}

function getPermissions(req, res) {

  permissionLog('get request!');

  pool.getConnection(function(err, connection) {
    if(err) {
      console.error(err);
      return res.send(500, new Error('mysql'));
    }
    var query = connection.query(
      'SELECT p.*, ghp.* '+
      'FROM users u '+
      'INNER JOIN users_has_groups uhg ON u.user_id = uhg.users_user_id '+
      'INNER JOIN groups g ON g.group_id = uhg.groups_group_id '+
      'INNER JOIN groups_has_permissions ghp ON g.group_id = ghp.groups_group_id '+
      'INNER JOIN permissions p ON p.permission_id = ghp.permissions_permission_id '+
      'INNER JOIN permissions_has_applications pha ON p.permission_id = pha.permissions_permission_id '+
      'INNER JOIN applications a ON a.application_shortname = pha.applications_application_shortname '+
      'WHERE user_email = ?;',
      [req.params.email],
      function(err, results) {
        connection.release();
        if(err) {
          console.error(err, query.sql);
          return res.send(500, new Error('mysql'));
        }
        console.log(results);
        res.send(200, {data: 'here'});
      }
    );
  });
}


function activateRoute(server, mysqlPool, checkAuth) {
  pool = mysqlPool;
  server.post('/permissions/user/:email', checkAuth, updatePermissions);
  server.get('/permissions/user/:email', checkAuth, getPermissions);
}

module.exports.activateRoute = activateRoute;
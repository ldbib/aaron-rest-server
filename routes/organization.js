
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

var util      = require('util');
var orgLog    = util.debuglog('org');

//var config    = require('../config');

var pool = null;

function updateOrganization(req, res) {
  orgLog('update request received!');
  pool.getConnection(function(err, connection) {
    if(err) {
      console.error(err);
      return res.send(500, new Error('mysql'));
    }

    // TODO: check permissions!

    var post = {};
    if(typeof req.params.shortname !== 'string') {
      console.error('updateOrganization: invalid-input-data');
      return res.send(400, new Error('invalid-input-data'));
    }
    /*if(typeof req.body.organization_shortname === 'string') {
      if(req.body.organization_shortname.length > 0  && req.body.organization_shortname.length < 256) {
        post.organization_shortname = req.body.organization_shortname;
      } else {
        console.error('updateOrganization: invalid-input-data, shortname');
        return res.send(400, new Error('invalid-input-data, shortname'));
      }
    }*/
    if(typeof req.body.organization_name === 'string') {
      if(req.body.organization_name.length > 0  && req.body.organization_name.length < 256) {
        post.organization_name = req.body.organization_name;
      } else {
        console.error('updateOrganization: invalid-input-data, name');
        return res.send(400, new Error('invalid-input-data, name'));
      }
    }
    if(Object.keys(post).length === 0) {
      console.error('updateOrganization: invalid-input-data');
      return res.send(400, new Error('no-data-inputted'));
    }
    var query = connection.query(
      'UPDATE organizations '+
      'SET ? '+
      'WHERE organization_name = ?;'
      , [post, req.params.organization_shortname], function(err, results) {
        connection.release();
        if(err) {
          console.error(err, query.sql);
          return res.send(500, new Error('mysql'));
        }
        console.log(results);
        return res.send(200, {message: 'success'});
      }
    );
  });
}

function getMyOrganizations(req, res) {
  orgLog('update request received!');
  pool.getConnection(function(err, connection) {
    if(err) {
      console.error(err);
      return res.send(500, new Error('mysql'));
    }
    connection.query(
      'SELECT organization_shortname, organization_name FROM users '+
      'INNER JOIN users_has_workplaces ON user_id = users_user_id '+
      'INNER JOIN workplaces ON workplace_id = workplaces_workplace_id '+
      'INNER JOIN organizations ON organizations_organization_shortname = organization_shortname '+
      'WHERE user_email = ? OR user_pemail = ?;', [req.authUser, req.authUser], function(err, results) {
        if(err) {
          console.error(err);
          return res.send(500, new Error('mysql'));
        }
        res.send(200, results);
      }
    );
  });
}


function activateRoute(server, mysqlPool, checkAuth) {
  pool = mysqlPool;
  server.put('/organization/:shortname', checkAuth, updateOrganization);
  server.get('/organization/for/me', checkAuth, getMyOrganizations);
}

module.exports.activateRoute = activateRoute;
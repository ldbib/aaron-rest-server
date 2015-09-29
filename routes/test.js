
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
var testLog   = util.debuglog('test');


var pool = null;

function testPut(req, res, next) {
  testLog('put', req.params);
  res.send(200, {put: true});
}
function testDelete(req, res, next) {
  testLog('delete', req.params);
  res.send(200, {delete: true});
}
function testPost(req, res, next) {
  testLog('post', req.params);
  res.send(200, {post: true});
}
function testGet(req, res, next) {
  testLog('get', req.params);
  res.send(200, {get: true});
}

function activateRoute(server, mysqlPool, checkAuth) {
  pool = mysqlPool;
  server.put('/test/:email', checkAuth, testPut); // EXISTNG
  server.del('/test/:email', checkAuth, testDelete); // DELETE
  server.head('/test/:email', checkAuth, testGet); // HEAD
  server.post('/test/:email', checkAuth, testPost); // CREATE
  server.get('/test/:email', checkAuth, testGet); // FETCH
}

module.exports.activateRoute = activateRoute;

/*

Aaron Rest Server (aaron-rest-server)

Copyright 2015 Emil Hemdal <emilAThemdal.se>
Copyright 2015 Landstinget Dalarna Bibliotek och informationscentral

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

'use strict';

var restify     = require('restify');
var cp          = require('restify-cookies');
var mysql       = require('mysql');
var qs          = require('querystring');
var os          = require('os');
var util        = require('util');
var url         = require('url');

var serverLog   = util.debuglog('server');

var config      = require('./config');

var pool        = mysql.createPool(config.mysql);

serverLog('Loading routes!');
var user        = require('./routes/user');
var auth        = require('./routes/authenticate');
var test        = require('./routes/test');
var perm        = require('./routes/permissions');
var orga        = require('./routes/organization');


serverLog('Starting restify server!');
var server = restify.createServer();

server.pre(restify.pre.userAgentConnection()); // Used to make curl return right away with HEAD methods.

server.use(restify.queryParser());
server.use(cp.parse);

server.use(restify.bodyParser({
  maxBodySize: 0,
  mapParams: true,
  mapFiles: false,
  overrideParams: false,
  uploadDir: os.tmpdir(),
  multiples: true,
  hash: 'sha1'
}));

server.use(function(req, res, next) {
  // TODO check GET arguments
  //console.log(req.body);
  //serverLog('req.body was', req.body);
  var parsedURL;
  if(req.headers.origin) {
    parsedURL = url.parse(req.headers.origin);
    if(config.http.domains.indexOf(parsedURL.host) !== -1) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
  }
  next();
});

serverLog('Activating routes!');
auth.activateRoute(server, pool); // I know checkAuth already! :)
user.activateRoute(server, pool, auth.checkAuth);
test.activateRoute(server, pool, auth.checkAuth);
perm.activateRoute(server, pool, auth.checkAuth);
orga.activateRoute(server, pool, auth.checkAuth);

server.listen(22766, function() {
  console.log('%s listening at %s', server.name, server.url);
});


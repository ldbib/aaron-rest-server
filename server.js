
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
var mysql       = require('mysql');
var qs          = require('querystring');
var util        = require('util');

var serverLog   = util.debuglog('server');

var config      = require('./config');

var pool        = mysql.createPool(config.mysql);


serverLog('Loading routes!');
var user        = require('./routes/user');
var auth        = require('./routes/authenticate');


serverLog('Starting restify server!');
var server = restify.createServer();

server.use(function(req, res, next) {
  if(req.headers.cookie) {
    serverLog('cookie(s) present');
    req.cookie = qs.parse(req.headers.cookie);
  }
  next();
});

serverLog('Activating routes!');
auth.activateRoute(server, pool); // I know checkAuth already! :)
user.activateRoute(server, pool, auth.checkAuth);

server.listen(22766, function() {
  console.log('%s listening at %s', server.name, server.url);
});


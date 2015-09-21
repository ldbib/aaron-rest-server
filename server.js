
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


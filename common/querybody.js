
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

var textBody = require('body');
var qs       = require('querystring');

function queryBody(req, cb) {
  textBody(req, function(err, body) {
    if(err) {
      return cb(null, err);
    }
    body = qs.parse(body);
    cb(body, null);
  });
}

module.exports.query = queryBody;

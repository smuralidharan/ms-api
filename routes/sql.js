var mysql      = require('mysql');
var msDb = mysql.createConnection({
	host     : 'localhost',
	user     : 'homestead',
	password : 'secret',
	port: 33060,
	database : 'foxy_project56'
});
msDb.connect();
module.exports.conn = msDb;
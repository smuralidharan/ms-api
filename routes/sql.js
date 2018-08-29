var mysql      = require('mysql');
var msDb = mysql.createConnection({
	host     : 'localhost',
	user     : 'ssostag',
	password : 'sskDwm8X',
	port: 3306,
	database : 'foxy_project56'
});
msDb.connect();
module.exports.conn = msDb;
var mysql      = require('mysql');
var msDb = mysql.createConnection({
	host     : '52.208.53.100',
	user     : 'ssostag',
	password : 'sskDwm8X',
	port: 33060,
	database : 'foxy_project56'
});
msDb.connect();
module.exports.conn = msDb;
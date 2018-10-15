var express = require('express')
var app = express()
var url = require('url')
app.get("/", function(req, res) {
	var resp = url.parse(req.url);
	var query_resp = resp['query'].split("&");
	for(i in query_resp)
	{
		re = /\[(.*)\]/i;
		var qry_val = query_resp[i];
		if(qry_val.includes("fcol["))
		{
			var result = qry_val.match(re);
			if(result)
			{
				var search_arr = qry_val.split("=");
				console.log(search_arr[1]);
			}
		}
	}
	res.render("index", {title: 'Welcome to MS'})
});
module.exports = app;
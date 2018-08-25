var express = require('express')
var app = express()
app.get("/", function(req, res, next) {
	req.getConnection(function(error, conn) {
		var qry = conn.query("SELECT mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2015'", function(err, results, fields)
		{
			if(err)
			{
				console.log(err);
			}
			else
			{
				var count = 0;
				var callback = [];
				getTaskStatus(count, results, callback);
			} 
		}); 
		
		function getTaskStatus(count, results, callback)
		{
			var task_status_qry = conn.query("SELECT 1 FROM manage_task_details mtd JOIN manage_tasks mt on mt.id = mtd.task_id WHERE mtd.task_id = '"+results[count].tbl_id+"' AND mt.done='completed' LIMIT 1", function(err, taskresults, fields) 
			{
				if(taskresults.length)
					results[count].task_status = "Task completed";
				else
					results[count].task_status = "Task pending";
				count++;
				if (count < results.length) {
	            	getTaskStatus(count, results, callback);
		        }
		        else {
		        	var rescount = 0;
		        	var callback = [];
		            // do something that you need to do after this
		        	 getSentBy(rescount, results, callback);

		            //callbacks(results);
		        }
			});
		}

		function getSentBy(count, results, callbacks)
		{
			var assigned_by_qry = conn.query("SELECT `task_details_id`, `callback_assignedBy` AS `sentby` FROM manage_callback_assign WHERE reminder_id = "+results[count].id, function(err, assignedresults, fields) 
			{
				if(assignedresults.length)
					results[count].sent_by = assignedresults[0].sentby;
				else
					results[count].sent_by = "";
				count++;
				if (count < results.length) {
		            getSentBy(count, results, callback);
		        }
		        else {
		        	var sentbycount = 0;
		        	var callback = [];
		            // do something that you need to do after this
		            getFirstUser(sentbycount, results, callback);
		            //callbacks(results);
		        }
			})	
		}

		function getFirstUser(count, results, callbacks)
		{
			var first_user_qry = conn.query("select `user` from manage_callback_v2_log where reminder_id='"+results[count].id+"' and user_status='OWNER' limit 1", function(err, resultFirstUser, fields)
			{
				if(resultFirstUser.length)
					results[count].first_user = resultFirstUser[0].user;
				else
					results[count].first_user = results[count].user;
				count++;
		        if (count < results.length) {
		            getFirstUser(count, results, callback);
		        }
		        else
		        {
		        	var firstUserCount = 0;
		        	var callback = [];
		        	getUserAccepted(firstUserCount, results, callback);
		        }
			})
		}

		function getUserAccepted(count, results, callbacks)
		{
			var accepted_user_qry = conn.query("select `user` from manage_callback_v2_log where reminder_id='"+results[count].id+"' and user_status='ACCEPT' limit 1", function(err, resultAcceptedUser, fields)
			{
				if(resultAcceptedUser.length)
					results[count].user_accepted = resultAcceptedUser[0].user;
				else
					results[count].user_accepted = "";
				count++;
		        if (count < results.length) {
		            getUserAccepted(count, results, callback);
		        }
		        else
		        {
		        	var acceptedUserCount = 0;
		        	var callback = [];
		        	var response = [];
		        	var inc = 0;
		        	var final_response = {};
		        	
		        	for(i=0; i<results.length; i++) {
		        		var resp_data = {};
		        		var formed_data = {};
		        		resp_data["id"] = results[i].id;
		        		resp_data["user"] = results[i].user;
		        		resp_data["status"] = results[i].status;
		        		formed_data['data'] = resp_data;
		        		response.push(resp_data); 
		        	}
		        	final_response.data = response;
		        	res.setHeader('Content-Type', 'application/json');
    				res.send(JSON.stringify(final_response));
		        	//res.render("callbackList", {data: results});
		        }
			})
		}

	 })
}); 
module.exports = app;
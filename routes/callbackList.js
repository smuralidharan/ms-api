var express = require('express')
var app = express()
app.get("/", function(req, res, next) {
	var start = 0;
	if(req.query.start !== undefined)
		start = req.query.start;
	var draw = req.query.draw;
	var total_results_count = 10;
	var order_by = req.query.order;
	// var order_by_val = order_by[0].dir;
	// var order_by_col = order_by[0].column;
	// console.log(order_by_col);
	//start = 0;
	req.getConnection(function(error, conn) {
		var qry = conn.query("SELECT SQL_CALC_FOUND_ROWS mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2017' LIMIT "+start+", 10", function(err, results, fields)
		{
			if(err)
			{
				console.log(err);
			}
			else
			{
				var cnt_qry = conn.query("SELECT FOUND_ROWS() cnt", function(newerr, newresults, newfields) {
					if(newresults.length)
					{
						total_results_count = newresults[0].cnt;
					}
				});
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

		function daysDiff(start_time, end_time)
		{
			var start_time = new Date(start_time);
			var end_time = new Date(end_time);
			var start_ts = start_time.getTime();
			var end_ts = end_time.getTime();
			var diff = end_ts - start_ts;
			return Math.round(diff/86400);
		}

		function info_links(host)
		{
			var url = "http://"+host;
			var info_links = "<p><a href='generate_login.php?host="+host+"&src=vieworders.php?link=v1' title='Client Admin' target='_new'><span class='glyphicon glyphicon-log-in'></span></a>&nbsp;&nbsp;&nbsp;<a href="+url+" target='_new'><span class='glyphicon glyphicon-globe' title='Client Website'></span></a>&nbsp;&nbsp;&nbsp;<a href='over_view.php?all="+host+"#top' title='Clients Profile' target='_new'><span class='glyphicon glyphicon-home'></span></a></p>";
			return info_links;
		}

		function dateDiff(start_time, end_time) 
		{
			date_future = new Date(end_time);
		    date_now = new Date(start_time);
		    seconds = Math.floor((date_future - (date_now))/1000);
		    minutes = Math.floor(seconds/60);
		    hours = Math.floor(minutes/60);
		    days = Math.floor(hours/24);
		    hours = hours-(days*24);
		    minutes = minutes-(days*24*60)-(hours*60);
		    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);
		    return days+" days,"+hours+" hours,"+minutes+" minutes,"+seconds+" seconds";
		}

		function getUserAccepted(count, results, callbacks)
		{
			var accepted_user_qry = conn.query("select `user` from manage_callback_v2_log where reminder_id='"+results[count].id+"' and status='ACCEPT' limit 1", function(err, resultAcceptedUser, fields)
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
		        	var complete_status = '';
		        	var done_time = '';
		        	var overdue = '';
		        	var original_doit_time = '';
		        	var callback_status = '';
		        	var last_button = '';
		        	var host_msg = '';
		        	
		        	for(i=0; i<results.length; i++) {
		        		var resp_data = [];
		        		var formed_data = {};
		        		var original_callback_time = results[i].original_doit_time;
		        		var original_callback_time = ("0" + original_callback_time.getDate()).slice(-2) + "-" + ("0"+(original_callback_time.getMonth()+1)).slice(-2) + "-" +original_callback_time.getFullYear() + " " + ("0" + original_callback_time.getHours()).slice(-2) + ":" + ("0" + original_callback_time.getMinutes()).slice(-2) + ":" + ("0" + original_callback_time.getSeconds()).slice(-2);

		        		var callback_time = "<p><strong>Callback time: </strong>"+original_callback_time+"</p>";

		        		var original_done_time = results[i].done_time;
		        		if(original_done_time != '0000-00-00 00:00:00')
		        		{
		        			var original_done_time = ("0" + original_done_time.getDate()).slice(-2) + "-" + ("0"+(original_done_time.getMonth()+1)).slice(-2) + "-" +original_done_time.getFullYear() + " " + ("0" + original_done_time.getHours()).slice(-2) + ":" + ("0" + original_done_time.getMinutes()).slice(-2) + ":" + ("0" + original_done_time.getSeconds()).slice(-2);
		        		}
		        		//var original_done_time = ("0" + original_done_time.getDate()).slice(-2) + "-" + ("0"+(original_done_time.getMonth()+1)).slice(-2) + "-" +original_done_time.getFullYear() + " " + ("0" + original_done_time.getHours()).slice(-2) + ":" + ("0" + original_done_time.getMinutes()).slice(-2) + ":" + ("0" + original_done_time.getSeconds()).slice(-2);



		        		callback_time += "<hr><p><strong>Completed time: </strong>"+original_done_time+"</p>";
		        		if(results[i].status != 'ACTIVE')
		        		{
		        			complete_status = 'Callback COMPLETED';
		        			done_time = daysDiff(results[i].original_doit_time, results[i].done_time);
		        			done_time = done_time+' days ';
		        			overdue = "-";
		        		}
		        		else
		        		{
		        			complete_status = '';
							done_time = '';
		        		}
		        		callback_status = "<p"+done_time+"</p>";
		        		callback_status += "<p>"+complete_status+"</p>";
		        		callback_status += "<p>"+results[i].task_status+"</p>";

		        		original_doit_time = new Date(results[i].original_doit_time);
						if(original_doit_time.getTime() < Date.now()) {
						    overdue = dateDiff(results[i].original_doit_time, new Date);
						    overdue_color = "color:red;";
						}else{
						    overdue = "-";
						    overdue_color = "";
						}
						last_button = "<button class='lightbox btn btn-default btn-xs' href='ajaxCalls/callbacks/callback_actions.php?reminder_id="+results[i].id+"&lightbox[iframe]=true&amp;lightbox[width]=60p&amp;lightbox[height]=80p&amp;lightbox[modal]=true'><i class='fa fa-list' aria-hidden='true'></i></button>";
						host_msg = results[i].host;
						host_msg += info_links(results[i].host);
		        		resp_data.push(host_msg);
		        		resp_data.push(results[i].sent_by);
		        		resp_data.push(results[i].department);
		        		resp_data.push(results[i].first_user);
		        		resp_data.push(results[i].user_accepted);
		        		resp_data.push(results[i].notes);
		        		resp_data.push(callback_time);
		        		resp_data.push(callback_status);
		        		resp_data.push(overdue);
		        		resp_data.push(last_button);
		        		formed_data['data'] = resp_data;
		        		response.push(resp_data); 
		        	}
		        	final_response['recordsTotal'] = total_results_count;
					final_response['recordsFiltered'] = total_results_count;
		        	final_response["data"] = response;
		        	final_response["draw"] = draw;
    				res.jsonp(final_response);
		        }
			})
		}

	 })
}); 
module.exports = app;
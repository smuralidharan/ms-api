var express = require('express')
var url = require('url')
var app = express()
var queryString = require('query-string');
app.get("/", function(req, res, next) {
	var start = 0;
	var page = 0;
	if(req.query.start !== undefined)
		start = req.query.start;
	var draw = req.query.draw;
	let total_results_count = 0;
	var sort_by_col = req.query.col;
	var size = req.query.size;
	page = req.query.page;
	var order_by = "ORDER BY id DESC";
	var search_by_val = "1";
	if(page > 0)
	{
		page = parseInt((page * 10)) + parseInt(1); 
	}
	/* Parse search url starts */
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
				

				if(result[0] == "[0]")
				{
					var search_by_col_host = search_arr[1];
				}
				else if(result[0] == "[2]")
				{
					var search_by_col_department = search_arr[1];
				}
				else if(result[0] == "[5]")
				{
					var search_by_col_callback_notes = search_arr[1];
				}
			}
		}
	}
	/* Parse search url ends */



	if(sort_by_col[0] !== undefined)
	{
		var order_by_val = (sort_by_col[0] == 0) ? "ASC" : "DESC";
		order_by = " ORDER BY host "+order_by_val;
	}
	if(sort_by_col[2] !== undefined)
	{
		var order_by_val = (sort_by_col[2] == 0) ? "ASC" : "DESC";
		order_by = " ORDER BY department_name "+order_by_val;
	}
	if(sort_by_col[5] !== undefined)
	{
		var order_by_val = (sort_by_col[5] == 0) ? "ASC" : "DESC";
		order_by = " ORDER BY notes "+order_by_val;
	}
	if(sort_by_col[6] !== undefined)
	{
		var order_by_val = (sort_by_col[6] == 0) ? "ASC" : "DESC";
		order_by = " ORDER BY original_doit_time "+order_by_val;
	}
	if(sort_by_col[8] !== undefined)
	{
		var order_by_val = (sort_by_col[8] == 0) ? "ASC" : "DESC";
		order_by = " ORDER BY original_doit_time "+order_by_val;
	}
	if(search_by_col_host !== undefined)
	{
		search_by_val = " mbr.host LIKE '%"+search_by_col_host+"%'";
	}
	if(search_by_col_department !== undefined)
	{
		search_by_val = " md.department_name LIKE '%"+search_by_col_department+"%'";
	}
	if(search_by_col_callback_notes !== undefined)
	{
		search_by_val = " mbr.notes LIKE '%"+search_by_col_callback_notes+"%'";
	}

	//start = 0;
	req.getConnection(function(error, conn) {
		var qry = conn.query("SELECT SQL_CALC_FOUND_ROWS mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where "+search_by_val+" AND mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2017'  "+order_by+" LIMIT "+page+", "+size, function(err, results, fields)
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
						var count = 0;
						var callback = [];
						if(total_results_count > 0)
						{
							getTaskStatus(count, results, callback);

						}
						else
						{
							var final_response = {};
							final_response['total_rows'] = 0;
				        	final_response['headers'] = ["Host", "Arranged_By", "Department", "Assigned_To", "Accepted_to_call_by", "Callback_notes", "Callback_time", "Callback_Status", "Overdue", "Action_log"];
				      		final_response['rows'] = [];
		    				res.jsonp(final_response);
						}
					}
				});
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
			var sort_by_col = req.query.col;
			var search_by_col = req.query.fcol;

			var order_by = "";
			var search_by_val = "1";

			if(sort_by_col[1] !== undefined)
			{
				var order_by_val = (sort_by_col[1] == 0) ? "ASC" : "DESC";
				order_by = " ORDER BY sentby "+order_by_val;
			}
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
						if(result[1] == '1')
						{
							var search_by_col_arranged_by = search_arr[1];
						}
					}
				}
			}
			if(search_by_col_arranged_by !== undefined)
			{
				search_by_val = "  callback_assignedBy LIKE '%"+search_by_col_arranged_by+"%'";
			}

			var assigned_by_qry = conn.query("SELECT `task_details_id`, `callback_assignedBy` AS `sentby` FROM manage_callback_assign WHERE "+search_by_val+" AND reminder_id = "+results[count].id+" "+order_by, function(err, assignedresults, fields) 
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
		        	if(!assignedresults.length && search_by_col_arranged_by !== undefined)
					{
						var final_response = {};
						final_response['total_rows'] = 0;
			        	final_response['headers'] = ["Host", "Arranged_By", "Department", "Assigned_To", "Accepted_to_call_by", "Callback_notes", "Callback_time", "Callback_Status", "Overdue", "Action_log"];
			      		final_response['rows'] = [];
						res.jsonp(final_response);
						return false;
					}
		            // do something that you need to do after this
		            getFirstUser(sentbycount, results, callback);
		            //callbacks(results);
		        }
			})	
		}

		function getFirstUser(count, results, callbacks)
		{
			var sort_by_col = req.query.col;
			var order_by = "";
			var search_by_val = "1";
			if(sort_by_col[3] !== undefined)
			{
				var order_by_val = (sort_by_col[3] == 0) ? "ASC" : "DESC";
				order_by = " ORDER BY user "+order_by_val;
			}

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
						if(result[0] == 3)
						{
							var search_by_col_assigned_to = search_arr[1];
						}
					}
				}
			}

			if(search_by_col_assigned_to !== undefined)
			{
				search_by_val = " user LIKE '%"+search_by_col_assigned_to+"%'";
			}
			var first_user_qry = conn.query("select `user` from manage_callback_v2_log where "+search_by_val+" AND reminder_id='"+results[count].id+"' and user_status='OWNER'"+order_by+" limit 1", function(err, resultFirstUser, fields)
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
			var sort_by_col = req.query.col;
			var order_by = "";
			var search_by_val = "1";
			var search_by_col_accepted_to = req.query.fcol[4];
			if(sort_by_col[4] !== undefined)
			{
				var order_by_val = (sort_by_col[4] == 0) ? "ASC" : "DESC";
				order_by = " ORDER BY useraccepted "+order_by_val;
			}
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
						if(result[0] == 4)
						{
							var search_by_col_accepted_to = search_arr[1];
						}
					}
				}
			}
			if(search_by_col_accepted_to !== undefined)
			{
				search_by_val = " user LIKE '%"+search_by_col_accepted_to+"%'";
			}
			var accepted_user_qry = conn.query("select `user` AS useraccepted from manage_callback_v2_log where "+search_by_val+" AND reminder_id='"+results[count].id+"' and status='ACCEPT'"+order_by+" limit 1", function(err, resultAcceptedUser, fields)
			{
				if(resultAcceptedUser.length)
					results[count].user_accepted = resultAcceptedUser[0].useraccepted;
				else
					results[count].user_accepted = "-";
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
						formed_data["Host"] = host_msg;
						formed_data["Arranged_By"] = results[i].sent_by;
						formed_data["Department"] = results[i].department;
						formed_data["Assigned_To"] = results[i].first_user;
						formed_data["Accepted_to_call_by"] = results[i].user_accepted;
						formed_data["Callback_notes"] = results[i].notes;
						formed_data["Callback_time"] = callback_time;
						formed_data["Callback_Status"] = callback_status;
						formed_data["Overdue"] = overdue;
						formed_data["Action_log"] = last_button;
		        		response.push(formed_data);
		        	}
		        	//console.log(response);

		        	final_response['total_rows'] = total_results_count;
		        	final_response['headers'] = ["Host", "Arranged_By", "Department", "Assigned_To", "Accepted_to_call_by", "Callback_notes", "Callback_time", "Callback_Status", "Overdue", "Action_log"];
		      		final_response['rows'] = response;
    				res.jsonp(final_response);
		        }
			})
		}

	 })
}); 
module.exports = app;
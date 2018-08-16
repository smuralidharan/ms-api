var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var path    = require("path");
var async = require('async');


var msDb    = require("./sql.js");
var common_fns    = require("./common_fns.js");

var cbList = [];
var output = [];
router.get('/', function(req, res, next) {

	/*getDB();

	function getDB(){
		    msDb.conn.query("SELECT mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2015'", function(err, rows) {
		        if (err){
		            console.log("error running query")
		          	return
		        } else {
		           // console.log("Output", output)
		            for(let i =0; i < rows.length; i++){	
		            	let task_status = async function() { // Async function expression
						  getTaskStatus(rows[i].id) // returns a promise
						    .then(function(value) {
						      console.log(value);
						    });
						}	
		                cbList[i] = {
		                    'id': rows[i].id,
		                    'original_doit_time': rows[i].original_doit_time,
		                    'tbl_id': rows[i].tbl_id,
		                    'user': rows[i].user,
		                    'status': rows[i].status,
		                    'host': rows[i].host,
		                    'notes': rows[i].notes,
		                    'done_time': rows[i].done_time,
		                    'department_name': rows[i].department,
		                    'row_assigned_by': task_status
		                }
		                console.log(cbList);
		                // res.render('callbackList', { "data": cbList });
		            }
		        }
		    })
	}
	async function getTaskStatus(task_id, callback) {
		msDb.conn.query("SELECT 1 FROM manage_task_details mtd  JOIN manage_tasks mt on mt.id=mtd.task_id WHERE mtd.task_id='"+task_id+"' AND mt.done='completed' LIMIT 1 ", 
		function(err, rows) {
			if(!err){
				if(rows.length)
					return "Task completed";
				else
					return "Task pending";
			} 
		});	
	}*/


	var query = msDb.conn.query("SELECT mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2015'", function (err, results, fields, callback) {
        if (err) {
            console.log("ERROR: " + err.message);
            //updateSockets(err);
        }
        else {
            // length of results
            var count = 0;
            // pass the db object also if you wanna use the same instance
            q2(count, results, callback);
        }
    });


	function q2(count, results, callbacks) {
	    var queryOrderKOT = msDb.conn.query("SELECT 1 FROM manage_task_details mtd JOIN manage_tasks mt on mt.id=mtd.task_id WHERE mtd.task_id='"+results[count].tbl_id+"'   AND mt.done='completed' LIMIT 1", function(err, resultKOT, KOTFields, callback) {
	        if(resultKOT.length)
	        	results[count].task_status = "Task completed";
	        else
	        	results[count].task_status = "Task pending";
	        count++;
	        if (count < results.length) {
	            q2(count, results, callback);
	        }
	        else {
	        	//console.log(results);
	        	var rescount = 0;
	            // do something that you need to do after this
	        	 q3(rescount, results, callback);
	            //callbacks(results);
	        }
	    });
	}

	function q3(count, results, callbacks) {
		console.log("SELECT `task_details_id`, `callback_assignedBy` AS `sentby` FROM manage_callback_assign WHERE reminder_id = "+results[count].id);
		var queryAssignedBy = msDb.conn.query("SELECT `task_details_id`, `callback_assignedBy` AS `sentby` FROM manage_callback_assign WHERE reminder_id = "+results[count].id, function(err, resultAssigned, AssignFields, callback) {
			if(resultAssigned.length)
				results[count].sentby = resultAssigned[0]['sentby'];
			else
				results[count].sentby = "";
			count++;
	        if (count < results.length) {
	            q3(count, results, callback);
	        }
	        else {
	        	var count = 0;
	            // do something that you need to do after this
	            //q3(count, results, callback);
	            //callbacks(results);
	            console.log(results);
	        }

		});
	}
	
	/*
	var resultData = function(callback)
	{ 
		msDb.conn.query("SELECT mbr.id,mbr.original_doit_time,mbr.tbl_id,mbr.user,mbr.status,mbr.host,mbr.notes, mbr.done_time,md.department_name as department from manage_button_reminders mbr JOIN manage_users mu on mbr.user=mu.user JOIN manage_departments md on mu.department = md.department_id where mbr.reason='callback' AND YEAR(mbr.`original_doit_time`) > '2015'", function(err, rows, fields) {
			if (!err)
			{		
				
				for(var i=0; i < rows.length; i++)
				{		
					cbList[i] = {
						'id': rows[i].id,
						'original_doit_time': rows[i].original_doit_time,
						'tbl_id': rows[i].tbl_id,
						'user': rows[i].user,
						'status': rows[i].status,
						'host': rows[i].host,
						'notes': rows[i].notes,
						'done_time': rows[i].done_time,
						'department_name': rows[i].department,
						'task_status': task_status,
						'row_assigned_by': common_fns.getTaskStatus(rows[i].id, function(resp) {
								return resp;
						});
					}
				}
				res.render('callbackList', { "data": cbList });
				console.log(cbList);
			}
			else
			{
			 	console.log('Error while performing Query.');
			}
		});    
	} */
});


module.exports = router;

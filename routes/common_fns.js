var msDb    = require("./sql.js");
var resp = '';
var sentby = '';
module.exports = {

  /*getTaskStatus: function (task_id, callback) {
  	//console.log("Task", task_id)  	
  	// msDb.conn.query("SELECT 1 FROM manage_task_details mtd  JOIN manage_tasks mt on mt.id=mtd.task_id WHERE mtd.task_id='"+task_id+"' AND mt.done='completed' LIMIT 1 ", 
  	// 	function(err, rows) {
  	// 	if(err){
  	// 		// console.log(new Error(err))
  	// 		callback(null, "Error appeared")
  	// 		return
  	// 	} else {
  	// 		console.log(rows)
  	// 		callback("Data appeared")
  	// 	}
  	// });
  	if(task_id){
  		callback("Data appeared")
  	} else {
  		callback("Error appeared")
  	}
  	return "comes";
  },*/
  getCallbackAssigned: function (reminder_id) {
  	msDb.conn.query("SELECT `task_details_id`, `callback_assignedBy` AS `sentby` FROM manage_callback_assign WHERE reminder_id='"+reminder_id+"'", function(err, rows, fields) {
  		if (!err)
		{			
	  		if(rows.length)
	  		{
	  			sentby = rows[0].sentby;
	  		}
	  		else
	  		{
	  			sentby = "";	
	  		}
  		}
  		else
  		{
  			sentby = "";
  		}
  	});
  	return sentby;
  }
};
const mysql = require('mysql');
const connection = mysql.createConnection({
  host     : "course-navigator.c8qlps2aghun.us-east-1.rds.amazonaws.com",
  user     : "admin",
  password : "C6bwtf4ocp#",
  database : "course_finder"
});
module.exports = connection
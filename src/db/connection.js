const mysql = require('mysql');
const connection = mysql.createConnection({
host     : 'ec2-54-165-91-173.compute-1.amazonaws.com',
user     : 'root',
password : '314159',
database : 'course_finder'
});
module.exports = connection
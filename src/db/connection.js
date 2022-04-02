const mysql = require('mysql');
const connection = mysql.createConnection({
host     : '127.0.0.1',
user     : 'root',
password : '314159',
database : 'course_finder'
});
module.exports = connection
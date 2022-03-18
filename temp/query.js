
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');
const db = mysql.createConnection({
  host     : "127.0.0.1",
  user     : "root",
  password : "password",
  database : "course_finder",
	multipleStatements: true
});
db.connect();
console.log("db connected");

const query_filter = (db, filter) => {
  let sql = `WITH course_filtered_types AS (
    SELECT * FROM course`;
  if(filter.courseTypesBitmap) {
    sql += ` WHERE ((b'${filter.courseTypesBitmap}' | course_type_bitmap) = course_type_bitmap)`;
  }
  sql += `), course_filtered_types_branch AS (
    SELECT * FROM course_filtered_types`;
  if(filter.branchList) {
    sql += ` WHERE branch in (${filter.branchList.map(b => `"${b}"`).join(',')})`;
  }
  sql += `), course_filtered_types_branch_credits AS (
    SELECT * FROM course_filtered_types_branch`;
  if(filter.credits) {
    sql += ` WHERE credits BETWEEN ${filter.credits.min || 0} AND ${filter.credits.max || 50}`;
  }
  sql += `), course_filtered_types_branch_credits_with_clash AS (
    SELECT *, (CONV(HEX(sched_bitmap & b'${filter.schedBitmap}'),16,10)!=0) AS clash FROM course_filtered_types_branch_credits
  ), course_filtered_types_branch_credits_with_clash_with_insts AS (
    SELECT * FROM course_filtered_types_branch_credits_with_clash
      INNER JOIN course_instructors USING (course_id)
      INNER JOIN instructor USING (inst_id)
  ) SELECT course_id,course_name,course_name_extended,branch,credits,credits_extended,sched_discussion,sched_tutorial,sched_practical,sched_practical,LPAD((CONV(HEX(course_type_bitmap),16,2)),32,'0') AS course_type_bitmap, sched_bitmap,clash,
    GROUP_CONCAT( inst_name ) as "inst_names",
    GROUP_CONCAT( inst_email ) as "inst_emails",
    GROUP_CONCAT( inst_id ) as "inst_ids" FROM course_filtered_types_branch_credits_with_clash_with_insts`;
  if(filter.noClash) {
    sql += ` WHERE clash=0`;  
  }
  sql += ` GROUP BY course_id;`;
  // console.log(sql);
  db.query(sql, function (err, res) {
    if (err) throw err;
    res.forEach(row => {
      let sched_bitmap = ''
      row.sched_bitmap.forEach(el => {
        sched_bitmap += el.toString(2).padStart(8,'0')
      });
      row.sched_bitmap = sched_bitmap;
    });
    // console.log(res.map(x => x.course_name+" -> "+x.sched_bitmap).join(' | '));
    console.log(res.map(x => x.course_name).join(' | '));
    // console.log(JSON.stringify(res));
    db.end();
    console.log('db disconnected');
  });
}

const filter = {
  noClash: true,
  courseTypesBitmap: '10000000000000000000000000000000',
  branchList: ["AE"],
  credits: {
    min: 8, max:9
  },
  schedBitmap: '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
};

query_filter(db,filter)

console.log(JSON.stringify(filter));

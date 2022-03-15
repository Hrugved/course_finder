const readXlsxFile = require('read-excel-file/node')
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

const query_setup = fs.readFileSync(path.join(__dirname, '../sql/setup.sql')).toString();

db.query(query_setup, function (err, _) {
  if (err) throw err;
  console.log("Created tables");
  readXlsxFile('./Course_Schedule_2021-22-2-converted.xlsx').then((rows) => {
    rows.shift(); // skip header
    const instructorsMap = new Map();
    const courseTypesMap = new Map();
    let sql_course = `INSERT IGNORE INTO course VALUES`;
    let sql_instructor = `INSERT IGNORE INTO instructor VALUES`;
    rows.forEach(row => {
      const branch = row[1];
      // console.log(branch);
      const course_raw = row[2];
      const course_name_extended = course_raw.substring(0, course_raw.indexOf("(")).trim();
      // console.log(course_name_extended);
      const course_name = course_raw.substring(course_raw.indexOf("(")+1,course_raw.indexOf(")")).trim();
      // console.log(course_name);
      const credits_raw = row[4];
      const credits_extended = credits_raw.substring(0, credits_raw.indexOf("(")).trim();
      // console.log(credits_extended);
      const credits = Number(credits_raw.substring(credits_raw.indexOf("(")+1,credits_raw.indexOf(")")).trim());
      // console.log(credits);
      let course_types = row[5].split(/,|\//); // comma or forward-slash
      course_types = course_types.map(raw => raw.trim());
      // console.log(course_types);
      courseTypesMap.set(course_name,course_types);
      let instructors = row[6].split(',');
      instructors = instructors.map(raw => raw.substring(0,raw.indexOf('(')).trim());
      // console.log(instructors);
      instructorsMap.set(course_name,instructors);
      let instructors_email = row[7].split(',');
      instructors_email = instructors_email.map(raw => raw.substring(0,raw.indexOf('(')).trim());
      // console.log(instructors_email);
      let sched_bitmap = ""; sched_bitmap = sched_bitmap.padStart(1440,'0');
      let sched_discussion = row[8];
      if(sched_discussion) {
        sched_discussion = sched_discussion.replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_discussion);
        sched_bitmap = getBitmap(sched_bitmap,sched_discussion);
      }
      let sched_tutorial = row[9];
      if(sched_tutorial) {
        sched_tutorial = sched_tutorial.replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_tutorial);
        sched_bitmap = getBitmap(sched_bitmap,sched_tutorial);
      }
      let sched_practical = row[10];
      if(sched_practical) {
        sched_practical = sched_practical.replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_practical);
        sched_bitmap = getBitmap(sched_bitmap,sched_practical);
      }
      // console.log(sched_bitmap);
      sql_course += ` (DEFAULT, '${course_name}', '${course_name_extended}', '${branch}', ${credits}, '${credits_extended}', '${sched_discussion}', '${sched_tutorial}', '${sched_practical}', b'${sched_bitmap}'),`;
      instructors.forEach((inst,i) => {
        sql_instructor += ` (DEFAULT, '${inst}', '${instructors_email[i]}'),`;  
      })
    });
    sql_course = sql_course.replace(/.$/,";");
    sql_instructor = sql_instructor.replace(/.$/,";");
    // console.log(sql_instructor);
    db.query(sql_course, function (err, result) {
      if (err) throw err;
      console.log("records inserted into course");
      db.query(sql_instructor, function (err, result) {
        if (err) throw err;
        console.log("records inserted into instructor");
        let sql_course_instructors = `INSERT IGNORE INTO course_instructors VALUES`;
        for (const [course_name, instructors] of instructorsMap) {
          instructors.forEach(inst_name => {
            sql_course_instructors += `((SELECT course_id FROM course WHERE course_name = '${course_name}' LIMIT 1),(SELECT inst_id FROM instructor WHERE inst_name = '${inst_name}' LIMIT 1)),`;
          });
        }
        sql_course_instructors = sql_course_instructors.replace(/.$/,";");
        // console.log(sql_course_instructors);
        db.query(sql_course_instructors, function (err, result) {
          if (err) throw err;
          console.log("records inserted into course_instructors");
          let sql_course_types = `INSERT IGNORE INTO course_types VALUES`;
          for (const [course_name, types] of courseTypesMap) {
            types.forEach(type => {
              sql_course_types += `((SELECT course_id FROM course WHERE course_name = '${course_name}' LIMIT 1),'${type}'),`;
            });
          }
          sql_course_types = sql_course_types.replace(/.$/,";");
          // console.log(sql_course_types);
          db.query(sql_course_types, function (err, result) {
            if (err) throw err;
            console.log("records inserted into course_types");
            db.end();
            console.log("db disconnected");
          });
        });
      });
    });
  });
});

const parseString = (str) => {
  str = str.replace(/ *\([^)]*\) */g, "").toLowerCase();
  str+=" ";
  // console.log(str);
  let arr = new Array();
  for(i=0;i<str.length;) {
    if(str[i]=='m') {arr.push('m');i++;}
    else if(str[i]=='t' && str[i+1]!='h') {arr.push('t');i++;}
    else if(str[i]=='w') {arr.push('w');i++;}
    else if(str[i]=='t') {arr.push("th");i+=2;} // th
    else if(str[i]=='f') {arr.push('f');i++;}
    else if(str[i]>='0' && str[i]<='9') {
      let num = str[i++];
      if(str[i]>='0' && str[i]<='9') num += str[i++];
      i++; // :
      arr.push(num);
      num = str[i++];
      if(str[i]>='0' && str[i]<='9') num += str[i++];
      arr.push(num);
    } else i++;
  }
  return arr;
}

// interval bitmap of M 00:00-00:05 till F 23:55-00:00
const getBitmap = (bitmap,str) => {
  let arr = parseString(str)
  // console.log(arr);
  for(i=0;i<arr.length;i++) {
    let daysOff = new Array();
    for(;;i++) {
      let dayOff;
      if(arr[i]=='m') dayOff=0;
      else if(arr[i]=='t') dayOff=288;
      else if(arr[i]=='w') dayOff=576;
      else if(arr[i]=="th") dayOff=864;
      else if(arr[i]=='f') dayOff=1152;
      else break;
      daysOff.push(dayOff)
    }
    const startOff = (Number(arr[i++])*12) + Number(arr[i++])/5; 
    const endOff = (Number(arr[i++])*12) + Number(arr[i])/5;
    daysOff.forEach(dayOff => {
      let update = ""
      update = update.padStart(endOff-startOff,'1');
      bitmap = bitmap.substring(0, dayOff+startOff) + update + bitmap.substring(dayOff+endOff)
    });
  }
  return bitmap;
}
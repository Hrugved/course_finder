const readXlsxFile = require("read-excel-file/node");
const mysql = require("mysql");
const path = require("path");
const fs = require("fs");
const { courseTypesMap } = require("../helpers/courseTypes");
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "course_finder",
  multipleStatements: true,
});
db.connect();
console.log("db connected");

const query_setup = fs
  .readFileSync(path.join(__dirname, "./setup.sql"))
  .toString();

function asyncFunction(row) {
 return new Promise((resolve, reject) => {
   setTimeout(() => {
      const branch = row[1].toUpperCase().replace(/(\r\n|\n|\r)/gm, "").replace(/'/g, "\\'");
      // console.log(branch);
      const course_raw = row[2].toUpperCase().replace(/(\r\n|\n|\r)/gm, "").replace(/'/g, "\\'");
      const course_name_extended = course_raw
        .substring(0, course_raw.indexOf("("))
        .trim();
      // console.log(course_name_extended);
      const course_name = course_raw
        .substring(course_raw.indexOf("(") + 1, course_raw.indexOf(")"))
        .trim();
      // console.log(course_name);
      const credits_raw = row[4].replace(/(\r\n|\n|\r)/gm, "").toUpperCase();
      const credits_extended = credits_raw
        .substring(0, credits_raw.indexOf("("))
        .replace(/'/g, "\\'")
        .trim();
      // console.log(credits_extended);
      const credits = Number(
        credits_raw
          .substring(credits_raw.indexOf("(") + 1, credits_raw.indexOf(")"))
          .trim()
      );
      // console.log(credits);
      const course_type = row[5].toUpperCase().replace(/(\r\n|\n|\r)/gm, "").replace(/'/g, "\\'");
      let course_type_list = course_type.split(/,|\//); // comma or forward-slash
      course_type_list = course_type_list.map((raw) =>
        raw.replace(/\s/g, "").trim()
      );
      course_types_bitmap = getCourseTypesBitmap(course_type_list);
      // console.log(course_types_bitmap);
      let instructors = row[6].toUpperCase().replace(/'/g, "\\'").replace(/(\r\n|\n|\r)/gm, "").split(",");
      instructors = instructors.map((raw) =>
        raw.substring(0, raw.indexOf("(")).trim()
      );
      // console.log(instructors);
      let instructors_email = row[7].replace(/'/g, "\\'").split(",");
      instructors_email = instructors_email.map((raw) =>
        raw.substring(0, raw.indexOf("(")).trim()
      );
      // console.log(instructors_email);
      let sched_bitmap = "";
      sched_bitmap = sched_bitmap.padStart(1440, "0");
      let sched_discussion = row[8];
      if (sched_discussion) {
        sched_discussion = sched_discussion
          .toUpperCase()
          .replace(/'/g, "\\'")
          .replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_discussion);
        sched_bitmap = getBitmap(sched_bitmap, sched_discussion);
      }
      let sched_tutorial = row[9];
      if (sched_tutorial) {
        sched_tutorial = sched_tutorial
          .toUpperCase()
          .replace(/'/g, "\\'")
          .replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_tutorial);
        sched_bitmap = getBitmap(sched_bitmap, sched_tutorial);
      }
      let sched_practical = row[10];
      if (sched_practical) {
        sched_practical = sched_practical
          .toUpperCase()
          .replace(/'/g, "\\'")
          .replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
        // console.log(sched_practical);
        sched_bitmap = getBitmap(sched_bitmap, sched_practical);
      }
      // console.log(sched_bitmap);
      let sql_course = `INSERT IGNORE INTO course VALUES (DEFAULT, '${course_name}', '${course_name_extended}', '${branch}', ${credits}, '${credits_extended}', '${sched_discussion}', '${sched_tutorial}', '${sched_practical}', b'${sched_bitmap}', '${course_type}', b'${course_types_bitmap}' );`;
      db.query(sql_course, function (err, result) {
        if (err) {
          console.log(
            `failed inserting into table course: ${row[0]}, ${sql_course}`
          );
          resolve(row);
        }
        let sql_instructor = `INSERT IGNORE INTO instructor VALUES`;
        instructors.forEach((inst, i) => {
          sql_instructor += ` (DEFAULT, '${inst}', '${instructors_email[i]}'),`;
        });
        sql_instructor = sql_instructor.replace(/.$/, ";");
        db.query(sql_instructor, function (err, result) {
          if (err) {
            console.log(
              `failed inserting into table instructor: ${row[0]}, ${sql_instructor}`
            );
            resolve(row);
          }
          let sql_course_instructors = `INSERT IGNORE INTO course_instructors VALUES`;
          instructors.forEach((inst_name) => {
            sql_course_instructors += `((SELECT course_id FROM course WHERE course_name = '${course_name}' LIMIT 1),(SELECT inst_id FROM instructor WHERE inst_name = '${inst_name}' LIMIT 1)),`;
          });
          sql_course_instructors = sql_course_instructors.replace(/.$/, ";");
          db.query(sql_course_instructors, function (err, result) {
            if (err) {
              console.log(
                `failed inserting into table course_instructors: ${row[0]}, ${sql_course_instructors}`
              );
              resolve(row);
            }
            resolve(row);
          });
        });
      });
   }, Math.random()*2000)// random delay to stagger order of returns
 })

}

db.query(query_setup, function (err, _) {
  if (err) throw err;
  console.log("Created tables");
  readXlsxFile("./Course_Schedule_2021-22-2-converted.xlsx").then((rows) => {
    rows.shift(); // skip header
    let requests = rows.map(asyncFunction);
    Promise.all(requests).then(() => {
      db.end();
      console.log('db disconnected');
      return;
    });
  });
});

const parseString = (str) => {
  str = str.replace(/ *\([^)]*\) */g, "").toLowerCase();
  str += " ";
  // console.log(str);
  let arr = new Array();
  for (i = 0; i < str.length; ) {
    if (str[i] == "m") {
      arr.push("m");
      i++;
    } else if (str[i] == "t" && str[i + 1] != "h") {
      arr.push("t");
      i++;
    } else if (str[i] == "w") {
      arr.push("w");
      i++;
    } else if (str[i] == "t") {
      arr.push("th");
      i += 2;
    } // th
    else if (str[i] == "f") {
      arr.push("f");
      i++;
    } else if (str[i] >= "0" && str[i] <= "9") {
      let num = str[i++];
      if (str[i] >= "0" && str[i] <= "9") num += str[i++];
      i++; // :
      arr.push(num);
      num = str[i++];
      if (str[i] >= "0" && str[i] <= "9") num += str[i++];
      arr.push(num);
    } else i++;
  }
  return arr;
};

// interval bitmap of M 00:00-00:05 till F 23:55-00:00
const getBitmap = (bitmap, str) => {
  let arr = parseString(str);
  // console.log(arr);
  for (i = 0; i < arr.length; i++) {
    let daysOff = new Array();
    for (; ; i++) {
      let dayOff;
      if (arr[i] == "m") dayOff = 0;
      else if (arr[i] == "t") dayOff = 288;
      else if (arr[i] == "w") dayOff = 576;
      else if (arr[i] == "th") dayOff = 864;
      else if (arr[i] == "f") dayOff = 1152;
      else break;
      daysOff.push(dayOff);
    }
    const startOff = Number(arr[i++]) * 12 + Number(arr[i++]) / 5;
    const endOff = Number(arr[i++]) * 12 + Number(arr[i]) / 5;
    daysOff.forEach((dayOff) => {
      let update = "";
      update = update.padStart(endOff - startOff, "1");
      bitmap =
        bitmap.substring(0, dayOff + startOff) +
        update +
        bitmap.substring(dayOff + endOff);
    });
  }
  return bitmap;
};

const getCourseTypesBitmap = (courseTypes) => {
  let types = "";
  types = types.padStart(32, "0");
  // console.log(courseTypes);
  courseTypes.forEach((ctype) => {
    types =
      types.substring(0, courseTypesMap.get(ctype)) +
      "1" +
      types.substring(courseTypesMap.get(ctype) + 1);
  });
  return types;
};

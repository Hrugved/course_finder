/** 
{
    "filter": {
        "semester": "22-even",
        "clash": false,
        "courseTypeList": {
          "include": ["DE","DC"],
          "exclude": ["REGULAR"]
        },
        "branchList": ["AE","CHM"],
        "credits": {
            "min": 8,
            "max": 9
        },
        "schedBitmap": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    }
}
*/

let freeSchedBitmap = "";
freeSchedBitmap = freeSchedBitmap.padStart(1440, "0");

const get_all = (semester) => {
  return `WITH insts AS ( 
    SELECT course_id, 
    GROUP_CONCAT( inst_name ) as "inst_names",
      GROUP_CONCAT( inst_email ) as "inst_emails",
      GROUP_CONCAT( inst_id ) as "inst_ids"
    FROM course_instructors 
      INNER JOIN instructor USING (inst_id)
      GROUP BY course_id),
  course_semester AS (SELECT * FROM course WHERE semester='${semester}' ) 
  SELECT * FROM course_semester INNER JOIN insts using (course_id);`
}

const get_filtered = (filter) => {
  let sql = `WITH course_sem AS ( SELECT * FROM course WHERE semester='${filter.semester}' ),`
  if(filter.courseTypesList) {
    sql += ` course_include_types AS ( SELECT course_id FROM course_types WHERE course_type IN (${filter.courseTypesList.include.map(b => `"${b}"`).join(',')})),`;
    sql += `course_exclude_types AS ( SELECT * FROM course_types WHERE course_type IN (${filter.courseTypesList.exclude.map(b => `"${b}"`).join(',')})),`;
    sql += `course_filtered_types AS ( SELECT course_id FROM course_include_types LEFT JOIN course_exclude_types USING (course_id) WHERE course_type IS NULL),`;
    sql += `course_sem_types AS ( SELECT * FROM  course_sem INNER JOIN course_filtered_types USING (course_id) GROUP BY course_id),`;
  } else {
    sql += `course_sem_types AS ( SELECT * FROM  course_sem),`
  }
  sql += `course_sem_types_branch AS (SELECT * FROM course_sem_types`;
  if(filter.branchList) {
    sql += ` WHERE branch in (${filter.branchList.map(b => `"${b}"`).join(',')})`;
  }
  sql += `), course_sem_types_branch_credits AS (
    SELECT * FROM course_sem_types_branch`;
  if(filter.credits) {
    sql += ` WHERE credits BETWEEN ${filter.credits.min || 0} AND ${filter.credits.max || 50}`;
  }
  let schedBitmap = freeSchedBitmap;
  if(filter.schedBitmap) {
    schedBitmap = filter.schedBitmap;
  }
  sql += `), course_sem_types_branch_credits_with_clash AS (
    SELECT *, (CONV(HEX(sched_bitmap & b'${schedBitmap}'),16,10)!=0) AS clash FROM course_sem_types_branch_credits
  ) SELECT course_id,clash FROM course_sem_types_branch_credits_with_clash`;
  if(!filter.clash) {
    sql += ` WHERE clash=0`;  
  }
  sql += `;`;
  return sql;
};

const parse_sched_bitmap = (_rows) => {
  _rows.forEach(row => {
      let sched_bitmap = ''
      row.sched_bitmap.forEach(el => {
        sched_bitmap += el.toString(2).padStart(8,'0')
      });
      row.sched_bitmap = sched_bitmap;
    });
};

module.exports = {get_all, get_filtered, parse_sched_bitmap}
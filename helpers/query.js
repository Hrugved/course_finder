/** 
{
    "filter": {
        "semester": "22-even",
        "noClash": true,
        "courseTypesNotBitmap": "00000100000000000000000000000000",
        "courseTypesBitmap": "10000000000000000000000000000000",
        "branchList": [
            "AE"
        ],
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

const get_sql_query = (filter) => {
  let sql = `WITH course_sem AS ( SELECT * FROM course WHERE semester='${filter.semester}' ), course_sem_types AS (
    SELECT * FROM course_sem`;
  if(filter && filter.courseTypesBitmap) {
    sql += ` WHERE (((b'${filter.courseTypesBitmap}' | course_type_bitmap) = course_type_bitmap))`;
  }
  if(filter && filter.courseTypesNotBitmap) {
    sql += ` AND ((HEX(b'${filter.courseTypesNotBitmap}' & course_type_bitmap) = 0))`;
  }
  sql += `), course_sem_types_branch AS (
    SELECT * FROM course_sem_types`;
  if(filter && filter.branchList) {
    sql += ` WHERE branch in (${filter.branchList.map(b => `"${b}"`).join(',')})`;
  }
  sql += `), course_sem_types_branch_credits AS (
    SELECT * FROM course_sem_types_branch`;
  if(filter && filter.credits) {
    sql += ` WHERE credits BETWEEN ${filter.credits.min || 0} AND ${filter.credits.max || 50}`;
  }
  let schedBitmap = freeSchedBitmap;
  if(filter && filter.schedBitmap) {
    schedBitmap = filter.schedBitmap;
  }
  
  sql += `), course_sem_types_branch_credits_with_clash AS (
    SELECT *, (CONV(HEX(sched_bitmap & b'${schedBitmap}'),16,10)!=0) AS clash FROM course_sem_types_branch_credits
  ), course_sem_types_branch_credits_with_clash_with_insts AS (
    SELECT * FROM course_sem_types_branch_credits_with_clash
      INNER JOIN course_instructors USING (course_id)
      INNER JOIN instructor USING (inst_id)
  ) SELECT course_id,course_name,course_name_extended,branch,credits,credits_extended,sched_discussion,sched_tutorial,sched_practical,sched_practical,course_type,LPAD((CONV(HEX(course_type_bitmap),16,2)),32,'0') AS course_type_bitmap, sched_bitmap,clash,
    GROUP_CONCAT( inst_name ) as "inst_names",
    GROUP_CONCAT( inst_email ) as "inst_emails",
    GROUP_CONCAT( inst_id ) as "inst_ids" FROM course_sem_types_branch_credits_with_clash_with_insts`;
  if(filter && filter.noClash) {
    sql += ` WHERE clash=0`;  
  }
  sql += ` GROUP BY course_id;`;
  // console.log(sql);
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

module.exports = {get_sql_query, parse_sched_bitmap}
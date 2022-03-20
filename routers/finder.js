const express = require('express')
const db = require('../db/connection')
const { courseTypesMap } = require('../helpers/courseTypes')
const query = require('../helpers/query')
const router = new express.Router()

// create task
router.get('/ping', async (req,res ) => {
    res.status(200).send("pong")
})

router.get('/semesters', async (req,res) => {
    const sql = `SELECT semester FROM course GROUP BY semester`;
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        data = data.map(el => el.semester)
        res.status(200).send(data);
    });
})

router.get('/init', async (req,res) => {
    const out = {
        all_courses: null,
        sched_bitmap: "",
        course_types_included: "",
        course_types_excluded: "",
        course_types_map: [...courseTypesMap]
    }
    out.course_types_included = out.course_types_included.padStart(32, "0");
    out.course_types_excluded = out.course_types_excluded.padStart(32, "0");
    out.sched_bitmap = out.sched_bitmap.padStart(1440, "0");
    const sql = query.get_sql_query({semester: req.body.semester});
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        query.parse_sched_bitmap(data);
        // out.all_courses_map = new Map(data.map(i => [i.course_id, i]));
        out.all_courses = data;
        res.status(200).send(out);
    });
})

router.get('/filter', async (req,res) => {
    const sql = query.get_sql_query(req.body.filter);
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        query.parse_sched_bitmap(data);
        res.status(200).send(data);
    });
})

module.exports = router
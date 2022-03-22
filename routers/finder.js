const express = require('express')
const db = require('../db/connection')
const { courseTypesList } = require('../helpers/courseTypes')
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
    if(req.query.semester==null) {
        console.log('semester not found in params');
        res.status(400).send("semester not found in params");
        return;
    } 
    console.log('semester:'+req.query.semester);
    const out = {
        all_courses: null,
        sched_bitmap: "",
        course_types_list: courseTypesList,
        branch_list: null
    }
    out.sched_bitmap = out.sched_bitmap.padStart(1440, "0");
    let sql = query.get_all(req.query.semester);
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        query.parse_sched_bitmap(data);
        out.all_courses = data;
        sql = `SELECT branch FROM course WHERE semester='${req.query.semester}' GROUP BY branch`;
        db.query(sql, function (err, data) {
            if (err) {
                res.status(400).send(null);
                throw err;
            }
            out.branch_list = data.map(e => e.branch);
            console.log(out);
            res.status(200).send(out);
        });
    });
})

router.post('/filter', async (req,res) => {
    console.log(req.body.filter);
    const sql = query.get_filtered(req.body.filter);
    console.log(sql);
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        res.status(200).send(data);
    });
})

module.exports = router
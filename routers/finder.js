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
    // console.log('semester:'+req.query.semester);
    const out = {
        all_courses: null,
        sched_bitmap: "",
        course_types_list: null,
        branch_list: null,
        credits: {
            min: 0,
            max: 14
        }
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
        sql = `SELECT branch FROM course WHERE semester='${req.query.semester}' GROUP BY branch ORDER BY branch;`;
        db.query(sql, function (err, data) {
            if (err) {
                res.status(400).send(null);
                throw err;
            }
            out.branch_list = data.map(e => e.branch);
            sql = `SELECT course_type FROM course_types GROUP BY course_type ORDER BY course_type;`;
            db.query(sql, function (err, data) {
                if (err) {
                    res.status(400).send(null);
                    throw err;
                }
                out.course_types_list = data.map(e => e.course_type);
                sql = `SELECT MIN(credits) as min,MAX(credits) as max FROM course;`;
                db.query(sql, function (err, data) {
                    if (err) {
                        res.status(400).send(null);
                        throw err;
                    }
                    out.credits.min = data[0].min;
                    out.credits.max = data[0].max;
                    console.log('init all_courses len:'+out.all_courses.length);
                    res.status(200).send(out);
                });        
            });   
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
        console.log('filter len:'+data.length);
        res.status(200).send(data);
    });
})

router.post('/sched_bitmap', async (req,res) => { 
    if(req.body.selected_course_ids==null) {
        res.status(400).send(null);
        return
    }
    console.log(req.body.selected_course_ids);
    const sql = query.get_sched_bitmap(req.body.selected_course_ids); 
    console.log(sql);
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null); 
            throw err;
        }
        query.parse_sched_bitmap(data);
        res.status(200).send(data[0].sched_bitmap);
    }); 
})

router.post('/find-clashes', async (req,res) => {
    if(req.body.course_id==null || req.body.course_ids==null) {
        res.status(400).send(null);
        return
    }
    console.log(req.body.course_id);
    console.log(req.body.course_ids);
    const sql = query.get_clash_course_ids(req.body.course_id,req.body.course_ids);
    console.log(sql);
    db.query(sql, function (err, data) {
        if (err) {
            res.status(400).send(null);
            throw err;
        }
        data = data.map(x => x.course_id)
        console.log(data);
        res.status(200).send(data);
    });
})

module.exports = router
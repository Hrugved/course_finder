const express = require('express')
const db = require('../db/connection')
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

router.get('/', async (req,res) => {
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
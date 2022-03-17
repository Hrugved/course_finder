const express = require('express')
const db = require('../db/connection')
const router = new express.Router()

// create task
router.get('/ping', async (req,res ) => {
    res.status(200).send("pong")
})

router.get('/courses/all', async (req,res) => {
    const res = 
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Result: " + result);
        res.status(200).send()
    });
})

module.exports = router
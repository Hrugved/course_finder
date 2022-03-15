const express = require('express')
const db = require('../db/connection')
const router = new express.Router()

// create task
router.get('/ping', async (req,res ) => {
    res.status(200).send("pong")
})

module.exports = router
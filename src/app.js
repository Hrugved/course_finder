const express = require('express')
const cors = require('cors')
const path = require('path');

const db = require('./db/connection')
const finderRouter = require('./routers/finder')

app = express()
app.use(cors())
app.use(express.json())
app.use(finderRouter)

app.use(express.static(path.resolve(__dirname, '../build')));
app.get('*',(req,res) => {
    res.sendFile(path.resolve(__dirname,'../build','index.html'))
})

db.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

module.exports = app
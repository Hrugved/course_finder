const express = require('express')

const db = require('./db/connection')
const finderRouter = require('./routers/finder')

app = express()
app.use(express.json())
app.use(finderRouter)

db.connect(err => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

module.exports = app
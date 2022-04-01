const app = require('./app')
const port = process.env.PORT || PORT

app.listen(port,() => {
    console.log('Server is up and running on port ' + port)
})
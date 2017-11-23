const express = require('express')
const path = require('path')
const app = express()

const http = require('http').Server(app)
const io = require('socket.io')(http)
const crawl = require('./crawl')


app.use(express.static(__dirname + '/statics'))

app.get('/', function(req, res) {
    res.sendFile('index.html')
  // path.join(__dirname, 'public')
  //   res.sendFile(__dirname + '/statics/index.html')
})

io.on('connection', function(socket) {
    console.log('a user connected')
    socket.on('disconnect', function() {
        console.log('user disconnected')
    })

    socket.on('submit', function(name) {
      // todo 添加爬虫代码 之后在emit回歌曲地址
        crawl(name).then(data => {
            console.log(data)
            // arr.push(data)
            io.emit('change', data)
        })
    })

})

http.listen(3000, function() {
    console.log('listening on *:3000')
})

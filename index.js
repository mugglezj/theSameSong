const express = require('express')
const path = require('path')
const app = express()

const http = require('http').Server(app)
const socket = require('socket.io')
const io = socket(http)
const crawl = require('./crawl')
let curMusic = ''

app.use(express.static(__dirname + '/statics'))

app.get('/', function(req, res) {
    res.sendFile('index.html')
  // path.join(__dirname, 'public')
  //   res.sendFile(__dirname + '/statics/index.html')
})

io.on('connection', function(socket) {
    console.log('a user connected')
    if (curMusic) {
        socket.emit('changePlay', curMusic)
    }
    socket.on('disconnect', function() {
        console.log('user disconnected')
    })

    socket.on('submit', function(name) {
      // todo 添加爬虫代码 之后在emit回歌曲地址
        crawl(name).then(data => {
            // console.log(data)
            // arr.push(data)
            io.emit('change', data)
        })
    })
    socket.on('play', function(e) {
        // console.log('111', e)
        curMusic = e
        io.emit('changePlay', e)
    })
})

const port = process.env.HTTP_PORT || 3001 
http.listen(port, function() {
    console.log('listening on *:' + port)
})

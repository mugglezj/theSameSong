var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crawl = require('./crawl');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('submit',function(name){
    // todo 添加爬虫代码 之后在emit回歌曲地址
    crawl(name).then(data=>{
      console.log(data);
      io.emit('change',data);
    });
  })


});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);
console.log('Server listening on port :8080');


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

io.on('connection', function (socket) {
  setInterval(function(){
    var data = getRandomInt(0,100);
    io.sockets.emit('pushdata', data);
  },2000);

});

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Engine = require('tingodb')();
var database = new Engine.Db(__dirname + '/db', {});
var sampleCollection = database.collection('somestuff');

server.listen(8080);
console.log('Server listening on port :8080');


app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
    setInterval(function() {
        var data = getRandomInt(0, 100);
        sampleCollection.insert({
            "sensorvalue": data,
            "datetime": new Date()
        });
        getLatestSamples(5,function(results){
    		var theValues = []
    		for(var i=0; i<results.length; i++)
    		{
    			theValues.push(results[i].sensorvalue);
    		}
    		console.log(theValues);
    	});
        io.sockets.emit('pushdata', data);
    }, 2000);
});

function getLatestSamples(theCount, callback) {
    sampleCollection
        .find()
        .sort({
            "datetime": -1
        })
        .limit(theCount)
        .toArray(function(err, docList) {
            callback(docList);
        });
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

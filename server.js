'use strict';

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Engine = require('tingodb')();
var database = new Engine.Db(__dirname + '/db', {});
var sampleCollection = database.collection('somestuff');
var GPIO = require('onoff').Gpio;
var led = new GPIO(18, 'out');
var button = new GPIO(17, 'in', 'both');

server.listen(8080);
console.log('Server listening on port :8080');


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

button.watch(light);

io.on('connection', function(socket) {
    setInterval(function() {
        var state = led.readSync();
        led.writeSync(Number(!state));
        var data = Number(state);
        sampleCollection.insert({
            "sensorvalue": data,
            "datetime": new Date()
        });
        getLatestSamples(5, function(results) {
    		var theValues = [];
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

function light(err, state) {
    if (state == 1) {
        led.writeSync(1);
    } else {
        led.writeSync(0);
    }
}

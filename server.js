'use strict';

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var tsl2591 = require('tsl2591');

var Engine = require('tingodb')();
var database = new Engine.Db(__dirname + '/db', {});
var sampleCollection = database.collection('somestuff');

var GPIO = require('onoff').Gpio;
var led = new GPIO(18, 'out');
var button = new GPIO(17, 'in', 'both');
var lightSensor = new GPIO(23, 'in', 'both');
var tsl2591Sensor = new tsl2591({device: '/dev/i2c-1'});
var tsl2591SensorReady = false;

server.listen(8080);
console.log('Server listening on port :8080');


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

button.watch(light);

io.on('connection', function(socket) {
    setInterval(function() {
        //blink LED
        var ledState = led.readSync();
        led.writeSync(Number(!ledState));

        //get simple light sensor data
        var lightSensorData = lightSensor.readSync();

        //get complex light sensor data
        if (tsl2591SensorReady) {
            light.readLuminosity(function(err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    lightSensorData = data;
                    console.log(data);
                }
            });
        }

        data = lightSensorData;
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

tsl2591Sensor.init({AGAIN: 0, ATIME: 1}, function(err) {
    if (err) {
        console.log(err);
        process.exit(-1);
    }
    else {
        console.log('TSL2591 ready');
        tsl2591SensorReady = true;
    }
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

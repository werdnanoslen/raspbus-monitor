'use strict';

var app = require('express')();
var Engine = require('tingodb')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var GPIO = require('onoff').Gpio;
var tsl2591 = require('tsl2591');
var PythonShell = require('python-shell');

var options = {
  mode: 'text',
  scriptPath: '/home/pi/web/raspbus-monitor/Adafruit_Python_BMP/examples'
};

var database = new Engine.Db(__dirname + '/db', {});
var sampleCollection = database.collection('somestuff');

var led = new GPIO(18, 'out');

var accelX = new GPIO(25, 'in');
var accelY = new GPIO(24, 'in');
var accelZ = new GPIO(23, 'in');
var lightSensor = new tsl2591({device: '/dev/i2c-1'});

var lightSensorReady = false;
var lightSensorData, accelData, accelDataString, barometerData;

server.listen(8080);
console.log('Server listening on port :8080');
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
    setInterval(function() {
        //blink LED
        var ledState = led.readSync();
        led.writeSync(Number(~ledState));

        //get accelerometer data
        accelData = {};
        accelData['x'] = accelX.readSync();
        accelData['y'] = accelY.readSync();
        accelData['z'] = accelZ.readSync();
        accelDataString = accelData.x + ', ' + accelData.y + ', ' + accelData.z;

        PythonShell.run('simpletest.py', options, function (err, results) {
            if (err) throw err;
            barometerData = results;
        });

        //get light sensor data
        if (lightSensorReady) {
            lightSensor.readLuminosity(function(err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    lightSensorData = data.vis_ir;
                }
            });
        }

        sampleCollection.insert({
            "accelData": accelDataString,
            "barometerData": barometerData,
            "lightSensorData": lightSensorData,
            "datetime": new Date()
        });
        getLatestSamples(5, function(results) {
    		var theValues = [];
    		for(var i=0; i<results.length; i++)
    		{
    			theValues.push(results[i].barometerData);
    		}
    		console.log(theValues);
    	});
        io.sockets.emit('pushdata', lightSensorData);
    }, 2000);
});

lightSensor.init({AGAIN: 0, ATIME: 1}, function(err) {
    if (err) {
        console.err('lightSensor error:', err);
        process.exit(-1);
    }
    else {
        console.log('lightSensor ready');
        lightSensorReady = true;
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

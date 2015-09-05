var gpio = require("pi-gpio");

// To read pin 16
gpio.read(25, function(err, value) {
    if(err) throw err;
    console.log(value); // The current state of the pin
});

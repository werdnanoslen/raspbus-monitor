var gpio = require("pi-gpio");

gpio.setDirection(16,input, function() {
    // To read pin 16
    gpio.read(16, function(err, value) {
        if(err) throw err;
        console.log(value); // The current state of the pin
    });
}

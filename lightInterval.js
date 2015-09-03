var GPIO = require('onoff').Gpio,
    led = new GPIO(18, 'out');

setInterval(function() {
    var state = led.readSync();
    led.writeSync(Number(!state));
}, 1000);

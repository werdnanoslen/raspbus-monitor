var GPIO = require('onoff').Gpio,
    led = new GPIO(18, 'out'),
    button = new GPIO(17, 'in', 'both');

function light(err, state) {
    if (state == 1) {
        led.writeSync(1);
    } else {
        led.writeSync(0);
    }
}

button.watch(light);

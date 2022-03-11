const modbus = require('jsmodbus')
const net = require('net')
const fs = require('fs');

const ipAddress = '192.168.0.172';
const port = 502;
const unitId = 1;


//Create a TCP Device
const options = {
    'host': ipAddress,
    'port': port
}
const socket = new net.Socket()
const client = new modbus.client.TCP(socket, unitId)

// Read modbus.json file to store the modbus channels
const modbusChannels = fs.readFileSync('modbus.json');
const channels = JSON.parse(modbusChannels);

// Function to generate a random uint16 value
function randomUint16() {
    return Math.floor(Math.random() * 3000);
}

// Function to generate a random bool value
function randomBool() {
    return Math.random() >= 0.5;
}

function setSingleBit(input, bitPosition, value) {
    let _in = input;
    if (value) {
        return _in |= 1 << bitPosition;
    } else {
        return _in &= ~(1 << bitPosition);
    }
}

let index = 0;

socket.on('connect', function() {
    console.log('Connected to modbus server')
    setInterval(function() {
        let num;
        if (channels[index].type == 'decimal') {
            num = randomUint16()
        } else if (channels[index].type == 'bit') {
            num = randomUint16()
        }
        client.writeSingleRegister(channels[index].address, num).catch(function() {
            console.error(arguments)
        })
        index++;
        if (index >= channels.length) {
            index = 0;
        }
    }, 100);
})

socket.on('error', console.error)
socket.connect(options)
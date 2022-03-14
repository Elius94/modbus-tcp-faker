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

socket.on('connect', function() {
    console.log('Connected to modbus server')

    // Write all the channels to the modbus server every 250ms
    setInterval(function() {
        // Split channels into two arrays
        const channels1 = channels.slice(0, channels.length / 2);
        const channels2 = channels.slice(channels.length / 2, channels.length);
        const values1 = channels1.map((channel) => {
            if (channel.type == 'decimal') {
                return randomUint16()
            } else if (channel.type == 'bit') {
                return randomUint16()
            } else if (channel.type == 'integer') {
                return randomUint16()
            }
        })
        const values2 = channels2.map((channel) => {
            if (channel.type == 'decimal') {
                return randomUint16()
            } else if (channel.type == 'bit') {
                return randomUint16()
            } else if (channel.type == 'integer') {
                return randomUint16()
            }
        })
        client.writeMultipleRegisters(channels1[0].address, values1).catch((err) => {
            console.error(err)
        })
        client.writeMultipleRegisters(channels2[0].address, values2).catch((err) => {
            console.error(err)
        })
    }, 250);

    // Reading the modbus channels every 500ms
    setInterval(function() {
        client.readHoldingRegisters(channels[0].address, channels.length / 2).then((response) => {
            client.readHoldingRegisters(channels[channels.length / 2].address, channels.length / 2).then((response) => {
                //console.log(response)
            }).catch((err) => {
                console.error(err)
            })
        }).catch((err) => {
            console.error(err)
        })
    }, 500);
})

socket.on('error', console.error)
socket.connect(options)
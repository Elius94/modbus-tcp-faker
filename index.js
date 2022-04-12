// For colors in the console
import chalk from 'chalk';
chalk.level = 1

import { ConsoleManager, OptionPopup, InputPopup } from 'console-gui-tools'
const GUI = new ConsoleManager({
    title: 'MODBUS PLC SIMULATOR', // Title of the console
    logsPageSize: 50, // Number of lines to show in logs page
    changeLayoutKey: 'ctrl+l', // Change layout with ctrl+l to switch to the logs page
})

import _ from 'lodash'
const { orderBy } = _

import modbus from 'jsmodbus'
import net from 'net'
import fs from 'fs'

const ipAddress = '192.168.0.172';
const port = 502;
const unitId = 1;

let connected = false
let hrCounter = 0
let run = false
let runProgressive = false
let runRead = false
let prog = 0
let lastErr = ""

let selectedChannel = ""
let typedVal = 0

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

// remove duplicates from an array
const removeDuplicates = (array) => {
    return array.filter((a, b) => array.indexOf(a) === b)
}
let reverseChannels = {}
channels.forEach((c, i) => {
    if (!reverseChannels[c.address]) {
        reverseChannels[c.address] = []
    }
    reverseChannels[c.address].push(c)
})

const channelsNames = removeDuplicates(channels.map((c, i) => c.name))


const startAddr = Number(Object.keys(reverseChannels)[0])
const size = Number(Object.keys(reverseChannels)[Object.keys(reverseChannels).length - 1]) - startAddr + 1

const echoChannelAddress = false;

function parseMessages(response) {
    response.forEach((r, i) => {
        try {
            if (reverseChannels[startAddr + i]) {
                if (reverseChannels[startAddr + i][0].type === 'bit') {
                    reverseChannels[startAddr + i].forEach((c, j) => {
                        if (c.value !== getSingleBit(r, c.offset)) {
                            c.value = getSingleBit(r, c.offset)
                            GUI.log(chalk.yellow(`[${c.name}]`) + `: ${c.value}`)
                        }
                    })
                } else {
                    if (reverseChannels[startAddr + i][0].value !== r) {
                        reverseChannels[startAddr + i][0].value = r
                        GUI.log(chalk.yellow(`[${reverseChannels[startAddr + i][0].name}]`) + `: ${reverseChannels[startAddr + i][0].value}`)
                    }
                }
            }
        } catch (e) {
            GUI.err(e.message)
        }
    })
}

function writeCommand(command, value) {
    if (connected) {
        GUI.log(chalk.yellow(`[${command}]`) + `: ${value}`)
        const _obj = channels.find((e) => e.name === command)
        const _addr = _obj.address
        const _val = _obj.type === 'bit' ? setSingleBit(value, _obj.offset, value) : value
        client.writeSingleRegister(_addr, _val, (err, response) => {
            if (err) {
                GUI.err(err.message)
            }
        })
    } else {
        GUI.err(chalk.red('Not connected'))
    }
}

// Function to generate a random uint16 value
function randomUint16() {
    return Math.floor(Math.random() * 3000);
}

function getIncrementalValue(value) {
    return value + 1;
}

function setSingleBit(input, bitPosition, value) {
    let _in = input;
    if (value) {
        return _in |= 1 << bitPosition;
    } else {
        return _in &= ~(1 << bitPosition);
    }
}

function getSingleBit(input, bitPosition) {
    return (input >> bitPosition) & 1;
}

socket.on('connect', function() {
    GUI.info('Connected to modbus server')
    connected = true
    drawGui()

    // Write all the channels to the modbus server every 250ms
    setInterval(function() {
        if (run) {
            // Split channels into two arrays
            const channels1 = channels.slice(0, channels.length / 2);
            const channels2 = channels.slice(channels.length / 2, channels.length);
            const values1 = channels1.map((channel) => {
                if (echoChannelAddress) {
                    return channel.address;
                } else {
                    if (channel.type == 'decimal') {
                        return randomUint16()
                    } else if (channel.type == 'bit') {
                        return randomUint16()
                    } else if (channel.type == 'integer') {
                        return randomUint16()
                    }
                }
            })
            const values2 = channels2.map((channel) => {
                if (echoChannelAddress) {
                    return channel.address;
                } else {
                    if (channel.type == 'decimal') {
                        return randomUint16()
                    } else if (channel.type == 'bit') {
                        return randomUint16()
                    } else if (channel.type == 'integer') {
                        return randomUint16()
                    }
                }
            })
            client.writeMultipleRegisters(channels1[0].address, values1).catch((err) => {
                GUI.error(JSON.stringify(err))
            }).then(v => {
                hrCounter++
            })
            client.writeMultipleRegisters(channels2[0].address, values2).catch((err) => {
                GUI.error(JSON.stringify(err))
            }).then(v => {
                hrCounter++
                drawGui()
            })
        }
    }, 250);

    // Reading the modbus channels every 500ms
    setInterval(function() {
        if (runRead) {
            client.readHoldingRegisters(startAddr, size).then((r) => {
                if (r.response.body.values)
                    parseMessages(r.response.body.values)
            }).catch((err) => {
                GUI.error(JSON.stringify(err))
            })
        }
    }, 500);

    // Progressive from PLC
    setInterval(function() {
        if (runProgressive) {
            client.writeSingleRegister(1044, prog).catch((err) => {
                GUI.error(JSON.stringify(err))
            }).then(v => {
                prog++
                hrCounter++
                drawGui()
            })
        }
    }, 1000);

})

socket.on('error', (err) => { GUI.error(JSON.stringify(err)) })
socket.connect(options)

/**
 * @description Updates the console screen
 *
 */
const updateConsole = async() => {
    let screen = ""
    screen += chalk.yellow(`Modbus TCP server simulator app! Welcome...`) + `\n`
    if (connected) screen += chalk.green(`Connected to TCP Server: ${ipAddress}:${port} - id: ${unitId}`) + `\n`
    screen += chalk.magenta(`Holding Register Setted: `) + chalk.white(`${hrCounter}`) + `\n\n`

    // Print if simulator is running or not
    if (!run) {
        screen += chalk.red(`Simulator is not running! `) + chalk.white(`press 'space' to start`) + `\n`
    } else {
        screen += chalk.green(`Simulator is running! `) + chalk.white(`press 'space' to stop`) + `\n`
    }

    // Print if progressive counter is running or not
    if (!runProgressive) {
        screen += chalk.red(`Progressive counter [hr1044] is not running! `) + chalk.white(`press 'p' to start it`) + `\n`
    } else {
        screen += chalk.green(`Progressive counter [hr1044] is running! `) + chalk.white(`press 'p' to stop it`) + `\n`
    }

    // Print if progressive counter is running or not
    if (!runRead) {
        screen += chalk.red(`HR Reading and parsing is off! `) + chalk.white(`press 'r' to start it`) + `\n`
    } else {
        screen += chalk.green(`HR Reading and parsing is on!  `) + chalk.white(`press 'r' to stop it`) + `\n`
    }

    // Spacer
    screen += `\n\n`;

    if (lastErr.length > 0) {
        screen += lastErr + `\n\n`
    }

    screen += chalk.bgBlack(`Commands:`) + `\n`;
    screen += `  ${chalk.bold('space')}   - ${chalk.italic('Start/stop simulator')}\n`;
    screen += `  ${chalk.bold('p')}      - ${chalk.italic('Start/stop progressive counter')}\n`;
    screen += `  ${chalk.bold('r')}      - ${chalk.italic('Start/stop HR reading and parsing')}\n`;
    screen += `  ${chalk.bold('s')}      - ${chalk.italic('Send command value')}\n`;
    screen += `  ${chalk.bold('q')}       - ${chalk.italic('Quit')}\n`;

    GUI.setHomePage(screen)
}

GUI.on("exit", () => {
    closeApp()
})

GUI.on("keypressed", (key) => {
    switch (key.name) {
        case 'c':
            {
                if (connected) {
                    socket.destroy()
                    connected = false
                }
                socket.connect(options)
            }
            break
        case 'space':
            run = !run
            drawGui()
            break
        case 'p':
            runProgressive = !runProgressive
            drawGui()
            break
        case 'r':
            runRead = !runRead
            drawGui()
            break
        case 's':
            new OptionPopup("popupSelectCommand", "Select Modbus Channel", channelsNames, selectedChannel).show().on("confirm", (_selectedChannel) => {
                selectedChannel = _selectedChannel
                GUI.warn(`Selected: ${selectedChannel}`)
                new InputPopup("popupTypeVal", `Type value for "${selectedChannel}"`, typedVal, true).show().on("confirm", (_val) => {
                    typedVal = _val
                    GUI.warn(`NEW VALUE: ${typedVal}`)
                    writeCommand(selectedChannel, typedVal)
                    drawGui()
                })
            })
            break
        case 'q':
            closeApp()
            break
        default:
            break
    }
})

const drawGui = () => {
    updateConsole()
}

const closeApp = () => {
    console.clear()
    process.exit()
}

drawGui()
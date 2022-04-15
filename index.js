// For colors in the console
import chalk from 'chalk';
chalk.level = 1

//import { ConsoleManager, OptionPopup, InputPopup } from 'console-gui-tools'
import { ConsoleManager, OptionPopup, InputPopup } from '../console-gui-tools/index.js'
const GUI = new ConsoleManager({
    title: 'MODBUS PLC SIMULATOR', // Title of the console
    logsPageSize: 50, // Number of lines to show in logs page
    changeLayoutKey: 'ctrl+l', // Change layout with ctrl+l to switch to the logs page
})

import _ from 'lodash'

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

const glideStorage = {
    from: 0,
    to: 0,
    step: 1,
    timers: []
}

let solidOnscreenValues = {
    'SOLID LIFE COUNTER': 0,
    'DGx HOUR CONTER LOW WORD (LLLL)': 0,
}

//Create a TCP Device
const options = {
    'host': ipAddress,
    'port': port
}
const socket = new net.Socket()
const client = new modbus.client.TCP(socket, unitId)

// Read modbus.json file to store the modbus channels
const modbusChannels = fs.readFileSync('modbus.json');
const channels = _.orderBy(JSON.parse(modbusChannels), 'name', 'asc');

// remove duplicates from an array
const removeDuplicates = (array) => {
    return array.filter((a, b) => array.indexOf(a) === b)
}
let reverseChannels = {}
let rawChannels = {}
channels.forEach((c, i) => {
    if (!reverseChannels[c.address]) {
        reverseChannels[c.address] = []
    }
    rawChannels[c.address] = 0
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
                        const v = getSingleBit(rawChannels[startAddr + i], c.offset)
                        if (rawChannels[startAddr + i] !== v) {
                            rawChannels[startAddr + i] = setSingleBit(rawChannels[startAddr + i], c.offset, v)
                            manageMessage(c.name, rawChannels[startAddr + i])
                        }
                    })
                } else {
                    if (rawChannels[startAddr + i] !== r) {
                        rawChannels[startAddr + i] = r
                        manageMessage(reverseChannels[startAddr + i][0].name, rawChannels[startAddr + i])
                    }
                }
            }
        } catch (e) {
            GUI.error(e.message)
        }
    })
}

function manageMessage(channel, value) {
    switch (channel) {
        case 'SOLID LIFE COUNTER':
            solidOnscreenValues[channel] = value
            drawGui()
            break
        case 'DGx HOUR CONTER LOW WORD (LLLL)':
            solidOnscreenValues[channel] = value
            drawGui()
            break
        default:
            GUI.log(chalk.yellow(`[${channel}]`) + `: ${value}`)
            break
    }
}

function writeCommand(command, value) {
    if (connected) {
        GUI.log(chalk.yellow(`[${command}]`) + `: ${value}`)
        const _obj = channels.find((e) => e.name === command)
        const _addr = _obj.address
        if (_obj.type === 'bit') {
            let currentValue = rawChannels[_obj.address]
            const _val = setSingleBit(currentValue, _obj.offset, value)
            currentValue = _val
            client.writeSingleRegister(_addr, _val, (err, response) => {
                if (err) {
                    GUI.error(err.message)
                }
            }).catch((err) => {
                GUI.error(err.message)
            })
        } else {
            rawChannels[_obj.address] = value
            client.writeSingleRegister(_addr, value, (err, response) => {
                if (err) {
                    GUI.error(err.message)
                }
            }).catch((err) => {
                GUI.error(err.message)
            })
        }
    } else {
        GUI.error(chalk.red('Not connected'))
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

function glideToValue(value, target, step) {
    if (value < target) {
        value += step
        if (value > target) {
            value = target
        }
    } else if (value > target) {
        value -= step
        if (value < target) {
            value = target
        }
    }
    return value
}

function glide(chan, from, to, step) {
    return setInterval(() => {
        const _ch = channels.find((e) => e.name === chan)
        if (connected && _ch.type !== 'bit') {
            rawChannels[_ch.address] = glideToValue(rawChannels[_ch.address], to, step)
            client.writeSingleRegister(_ch.address, rawChannels[_ch.address], (err, response) => {
                if (err) {
                    GUI.error(err.message)
                }
            }).catch((err) => {
                GUI.error(err.message)
            })
        }
    }, 100)
}

socket.on('connect', function() {
    connected = true
    GUI.info('Connected to modbus server')
        //drawGui()
})

socket.on("end", function() {
    connected = false
    GUI.error('Disconnected from modbus server')
        //drawGui()
})


// Write all the channels to the modbus server every 250ms
setInterval(function() {
    if (connected && run) {
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
    if (connected && runRead) {
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
    if (connected && runProgressive) {
        client.writeSingleRegister(1044, prog).catch((err) => {
            GUI.error(JSON.stringify(err))
        }).then(v => {
            prog++
            hrCounter++
            drawGui()
        })
    }
}, 1000);


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

    // Print solid Messages to show in the console (solidOnscreenValues)
    if (Object.keys(solidOnscreenValues).length > 0) {
        screen += '\n' + chalk.magenta(`Solid Data: `) + `\n`
        Object.keys(solidOnscreenValues).forEach((value) => {
            screen += chalk.white(`${value}: ${solidOnscreenValues[value]}`) + `\n`
        })
    }

    // Spacer
    screen += `\n\n`;

    if (lastErr.length > 0) {
        screen += lastErr + `\n\n`
    }

    screen += chalk.bgBlack(`Commands:`) + `\n`;
    screen += `  ${chalk.bold('space')}  - ${chalk.italic('Start/stop simulator')}\n`;
    screen += `  ${chalk.bold('p')}      - ${chalk.italic('Start/stop progressive counter (PLC isAlive)')}\n`;
    screen += `  ${chalk.bold('r')}      - ${chalk.italic('Start/stop HR reading and parsing')}\n`;
    screen += `  ${chalk.bold('s')}      - ${chalk.italic('Send command value')}\n`;
    screen += `  ${chalk.bold('g')}      - ${chalk.italic('Make a glide on channel')}\n`;
    screen += `  ${chalk.bold('h')}      - ${chalk.italic('Clear all glide actions')}\n`;
    screen += `  ${chalk.bold('c')}      - ${chalk.italic('Reconnect to server')}\n`;
    screen += `  ${chalk.bold('q')}      - ${chalk.italic('Quit')}\n`;

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
                const _chan = channels.find(c => c.name == selectedChannel)
                if (_chan && _chan.type === 'decimal' || _chan.type === 'integer') {
                    typedVal = rawChannels[_chan.address]
                } else if (_chan && _chan.type == 'bit') {
                    typedVal = getSingleBit(rawChannels[_chan.address], _chan.offset)
                }
                new InputPopup("popupTypeVal", `Type value for "${selectedChannel}"`, typedVal, true).show().on("confirm", (_val) => {
                    typedVal = _val
                    GUI.warn(`NEW VALUE: ${typedVal}`)
                    writeCommand(selectedChannel, typedVal)
                    drawGui()
                })
            })
            break
        case 'g':
            {
                new OptionPopup("popupSelectCommandGlide", "[Glide] Select Modbus Channel", channelsNames, selectedChannel).show().on("confirm", (_selectedChannel) => {
                    selectedChannel = _selectedChannel
                    GUI.warn(`Selected: ${selectedChannel}`)
                    const _chan = channels.find(c => c.name == selectedChannel)
                    if (_chan && _chan.type === 'decimal' || _chan.type === 'integer') {
                        typedVal = rawChannels[_chan.address]
                    } else if (_chan && _chan.type == 'bit') {
                        typedVal = getSingleBit(rawChannels[_chan.address], _chan.offset)
                    }
                    new InputPopup("popupTypeValFrom", `Type start value for "${selectedChannel}"`, glideStorage.from, true).show().on("confirm", (_val) => {
                        glideStorage.from = _val
                        GUI.warn(`FROM: ${glideStorage.from}`)
                        new InputPopup("popupTypeValTo", `Type target value for "${selectedChannel}"`, glideStorage.to, true).show().on("confirm", (_val) => {
                            glideStorage.to = _val
                            GUI.warn(`TO: ${glideStorage.to}`)
                            glideStorage.timers.push(glide(selectedChannel, glideStorage.from, glideStorage.to, glideStorage.step))
                            drawGui()
                        })
                    })
                })
            }
            break
        case 'h':
            glideStorage.timers.forEach(timer => {
                clearInterval(timer)
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
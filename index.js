import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ConfirmPopup } from 'console-gui-tools'
//import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ConfirmPopup } from '../console-gui-tools/src/ConsoleGui.js'
const GUI = new ConsoleManager({
    title: 'MODBUS PLC SIMULATOR', // Title of the console
    logsPageSize: 50, // Number of lines to show in logs page
    changeLayoutKey: 'ctrl+l', // Change layout with ctrl+l to switch to the logs page
})

import _ from 'lodash'

import modbus from 'jsmodbus'
import net from 'net'
import fs from 'fs'

//const ipAddress = '192.168.0.172';
const ipAddress = '10.0.0.20';
const port = 502;
const unitId = 1;

let connected = false
let hrCounter = 0
let run = false
let runProgressive = false
let runRead = false
let prog = 4
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
            GUI.log(`[${channel}]: ${value}`)
            break
    }
}

function writeCommand(command, value) {
    if (connected) {
        GUI.log(`[${command}]: ${value}`)
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
        GUI.error('Not connected')
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
        client.writeSingleRegister(1042, prog).catch((err) => {
            GUI.error(JSON.stringify(err))
        }).then(v => {
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
    const p = new PageBuilder()
    p.addRow({ text: `Modbus TCP server simulator app! Welcome...`, color: "yellow" })
    if (connected) p.addRow({ text: `Connected to TCP Server: ${ipAddress}:${port} - id: ${unitId}`, color: "green" })
    p.addRow({ text: `Holding Register Setted: `, color: "magenta" }, { text: `${hrCounter}`, color: "white" })

    // Print if simulator is running or not
    if (!run) {
        p.addRow({ text: `Simulator is not running! `, color: "red" }, { text: `press 'space' to start`, color: "white" })
    } else {
        p.addRow({ text: `Simulator is running! `, color: "green" }, { text: `press 'space' to stop`, color: "white" })
    }

    // Print if progressive counter is running or not
    if (!runProgressive) {
        p.addRow({ text: `Progressive counter [hr1044] is not running! `, color: "red" }, { text: `press 'p' to start it`, color: "white" })
    } else {
        p.addRow({ text: `Progressive counter [hr1044] is running! `, color: "green" }, { text: `press 'p' to stop it`, color: "white" })
    }

    // Print if progressive counter is running or not
    if (!runRead) {
        p.addRow({ text: `HR Reading and parsing is off! `, color: "red" }, { text: `press 'r' to start it`, color: "white" })
    } else {
        p.addRow({ text: `HR Reading and parsing is on!  `, color: "green" }, { text: `press 'r' to stop it`, color: "white" })
    }

    // Print solid Messages to show in the console (solidOnscreenValues)
    p.addSpacer()
    if (Object.keys(solidOnscreenValues).length > 0) {
        p.addRow({ text: `Solid Data: `, color: "magenta" })
        Object.keys(solidOnscreenValues).forEach((value) => {
            p.addRow({ text: `${value}: ${solidOnscreenValues[value]}`, color: "white" })
        })
    }

    // Spacer
    p.addSpacer(2);
    if (lastErr.length > 0) {
        p.addRow({ text: lastErr, color: "red" })
    }
    p.addSpacer(2);

    // Print the commands
    p.addRow({ text: `Commands: `, color: "white", bg: "bgBlack" })
    p.addRow({ text: `  'space'`, color: "white", bold: true }, { text: `  - start/stop the simulator`, color: "gray", italic: true })
    p.addRow({ text: `  'r'`, color: "white", bold: true }, { text: `  - start/stop the HR reading and parsing`, color: "gray", italic: true })
    p.addRow({ text: `  'p'`, color: "white", bold: true }, { text: `  - start/stop progressive counter (PLC isAlive)`, color: "gray", italic: true })
    p.addRow({ text: `  's'`, color: "white", bold: true }, { text: `  - send command value`, color: "gray", italic: true })
    p.addRow({ text: `  'g'`, color: "white", bold: true }, { text: `  - make a glide on channel`, color: "gray", italic: true })
    p.addRow({ text: `  'h'`, color: "white", bold: true }, { text: `  - clear all glide actions`, color: "gray", italic: true })
    p.addRow({ text: `  'c'`, color: "white", bold: true }, { text: `  - reconnect to server`, color: "gray", italic: true })
    p.addRow({ text: `  'q'`, color: "white", bold: true }, { text: `  - quit the app`, color: "gray", italic: true })

    p.addSpacer(2);

    GUI.setHomePage(p)
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
            new ConfirmPopup("popupQuit", "Are you sure you want to quit?").show().on("confirm", () => closeApp())
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
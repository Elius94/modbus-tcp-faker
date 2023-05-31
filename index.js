const {
  ConsoleManager,
  OptionPopup,
  InputPopup,
  PageBuilder,
  ConfirmPopup,
  Button,
  Box,
  InPageWidgetBuilder,
} = require("console-gui-tools");
//import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ConfirmPopup } from '../console-gui-tools/src/ConsoleGui.js'
const GUI = new ConsoleManager({
  title: "MODBUS PLC SIMULATOR FOR LCS TOOLKIT", // Title of the console
  logPageSize: 20, // Number of lines to show in logs page
  enableMouse: true,
  layoutOptions: {
    changeFocusKey: "ctrl+l", // Change focus with ctrl+l
    showTitle: true, // Show title in the top of the console
    type: "double", // Type of layout: single, double, triple
    direction: "horizontal", // Direction of the layout: horizontal, vertical
    boxColor: "green", // Color of the console box
    boxed: true, // Boxed console
  },
});

const { testNames, tests } = require("./lcs.js");

const _ = require("lodash");

const modbus = require("jsmodbus");
const net = require("net");
const fs = require("fs");

const ipAddress = "10.0.0.20";
//const ipAddress = '127.0.0.1';
const port = 502;
const unitId = 1;

let testMode = false;
let selectedTest = "";

let connected = false;
let hrCounter = 0;
let run = false;
let runProgressive = false;
let runRead = false;
let prog = 4;
let lastErr = "";

let selectedChannel = "_";
let selectedChannelOsc = "_";
let typedVal = 0;

const actionsStartPosition = {
  x: 0,
  y: 0,
}

let actionsButtons = [];
let defaultButton = undefined;

const glideStorage = {
  from: 0,
  to: 0,
  step: 1,
  timers: {},
};

const oscillatorStorage = {};

function sineWave(time, amplitude, frequency, phase) {
  // Calculate the value of the sine wave at the given time
  return amplitude * Math.sin(2 * Math.PI * frequency * time + phase);
}

const oscillator = (channel, offset, amplitude, period) => {
  // Make a sine wave oscillator based on the value
  return setInterval(() => {
    const value = sineWave(
      oscillatorStorage[channel].currentTime,
      amplitude,
      1 / (period * 10),
      0
    );
    const finalValue = Math.floor(value + offset);
    solidOnscreenValues[channel] = finalValue;
    writeCommand(channel, finalValue, false);
    drawGui();
    oscillatorStorage[channel].currentTime += 10;
  }, 10)
};

let solidOnscreenValues = {
  "SOLID LIFE COUNTER": 0,
  "DGx HOUR CONTER LOW WORD (LLLL)": 0,
};

//Create a TCP Device
const options = {
  host: ipAddress,
  port: port,
};
const socket = new net.Socket();
const client = new modbus.client.TCP(socket, unitId);

// Read modbus.json file to store the modbus channels
const modbusChannels = fs.readFileSync("modbus.json");
const channels = _.orderBy(JSON.parse(modbusChannels), "name", "asc");

// remove duplicates from an array
const removeDuplicates = (array) => {
  return array.filter((a, b) => array.indexOf(a) === b);
};
let reverseChannels = {};
let rawChannels = {};
channels.forEach((c, i) => {
  if (!reverseChannels[c.address]) {
    reverseChannels[c.address] = [];
  }
  rawChannels[c.address] = 0;
  reverseChannels[c.address].push(c);
});

const channelsNames = removeDuplicates(channels.map((c, i) => c.name));

const startAddr = Number(Object.keys(reverseChannels)[0]);
const size =
  Number(
    Object.keys(reverseChannels)[Object.keys(reverseChannels).length - 1]
  ) -
  startAddr +
  1;

const echoChannelAddress = false;

function parseMessages(response) {
  response.forEach((r, i) => {
    try {
      if (reverseChannels[startAddr + i]) {
        if (reverseChannels[startAddr + i][0].type === "bit") {
          if (rawChannels[startAddr + i] !== r) {
            rawChannels[startAddr + i] = r;
            reverseChannels[startAddr + i].forEach((c, j) => {
              const v = getSingleBit(rawChannels[startAddr + i], c.offset);
              if (rawChannels[startAddr + i] !== v) {
                rawChannels[startAddr + i] = setSingleBit(
                  rawChannels[startAddr + i],
                  c.offset,
                  v
                );
                manageMessage(c.name, v);
              }
            });
          }
        } else {
          if (rawChannels[startAddr + i] !== r) {
            rawChannels[startAddr + i] = r;
            manageMessage(
              reverseChannels[startAddr + i][0].name,
              rawChannels[startAddr + i]
            );
          }
        }
      }
    } catch (e) {
      GUI.error(e.message);
    }
  });
}

function manageMessage(channel, value) {
  GUI.log(`[${channel}]: ${value}`);
  solidOnscreenValues[channel] = value;
  if (channel === "SOLID TEST SELECTED (NUMBER)") {
    selectedTest = "";
    for (let i = 0; i < testNames.length; i++) {
      if (value === tests[testNames[i]].number) {
        selectedTest = testNames[i];
        break;
      }
    }
    GUI.log(`Test selected: ${selectedTest}`);
    deleteButtons();
    updateButtons(true);
  }
  drawGui();
}

function writeCommand(command, value, log = true) {
  if (connected) {
    if (log) GUI.log(`[${command}]: ${value}`);
    const _obj = channels.find((e) => e.name === command);
    const _addr = _obj.address;
    if (_obj.type === "bit") {
      let currentValue = rawChannels[_obj.address];
      const _val = setSingleBit(currentValue, _obj.offset, value);
      currentValue = _val;
      client
        .writeSingleRegister(_addr, _val, (err, response) => {
          if (err) {
            GUI.error(err.message);
          }
        })
        .catch((err) => {
          GUI.error(err.message);
        });
    } else {
      rawChannels[_obj.address] = value;
      client
        .writeSingleRegister(_addr, value, (err, response) => {
          if (err) {
            GUI.error(err.message);
          }
        })
        .catch((err) => {
          GUI.error(err.message);
        });
    }
  } else {
    GUI.error("Not connected");
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
    return (_in |= 1 << bitPosition);
  } else {
    return (_in &= ~(1 << bitPosition));
  }
}

function getSingleBit(input, bitPosition) {
  return (input >> bitPosition) & 1;
}

function glideToValue(value, target, step) {
  if (value < target) {
    value += step;
    if (value > target) {
      value = target;
    }
  } else if (value > target) {
    value -= step;
    if (value < target) {
      value = target;
    }
  }
  return value;
}

function glide(chan, from, to, step) {
  return setInterval(() => {
    const _ch = channels.find((e) => e.name === chan);
    if (connected && _ch.type !== "bit") {
      rawChannels[_ch.address] = glideToValue(
        rawChannels[_ch.address],
        to,
        step
      );
      client
        .writeSingleRegister(
          _ch.address,
          rawChannels[_ch.address],
          (err, response) => {
            if (err) {
              GUI.error(err.message);
            }
          }
        )
        .catch((err) => {
          GUI.error(err.message);
        });
    }
  }, 100);
}

socket.on("connect", function () {
  connected = true;
  GUI.info("Connected to modbus server");
  //drawGui()
});

socket.on("end", function () {
  connected = false;
  GUI.error("Disconnected from modbus server");
  //drawGui()
});

// Write all the channels to the modbus server every 250ms
setInterval(function () {
  if (connected && run) {
    // Split channels into two arrays
    const channels1 = channels.slice(0, channels.length / 2);
    const channels2 = channels.slice(channels.length / 2, channels.length);
    const values1 = channels1.map((channel) => {
      if (echoChannelAddress) {
        return channel.address;
      } else {
        if (channel.type == "decimal") {
          return randomUint16();
        } else if (channel.type == "bit") {
          return randomUint16();
        } else if (channel.type == "integer") {
          return randomUint16();
        }
      }
    });
    const values2 = channels2.map((channel) => {
      if (echoChannelAddress) {
        return channel.address;
      } else {
        if (channel.type == "decimal") {
          return randomUint16();
        } else if (channel.type == "bit") {
          return randomUint16();
        } else if (channel.type == "integer") {
          return randomUint16();
        }
      }
    });
    client
      .writeMultipleRegisters(channels1[0].address, values1)
      .catch((err) => {
        GUI.error(JSON.stringify(err));
      })
      .then((v) => {
        hrCounter++;
      });
    client
      .writeMultipleRegisters(channels2[0].address, values2)
      .catch((err) => {
        GUI.error(JSON.stringify(err));
      })
      .then((v) => {
        hrCounter++;
        drawGui();
      });
  }
}, 250);

// Reading the modbus channels every 500ms
setInterval(function () {
  if (connected && runRead) {
    client
      .readHoldingRegisters(startAddr, size)
      .then((r) => {
        if (r.response.body.values) parseMessages(r.response.body.values);
      })
      .catch((err) => {
        GUI.error(JSON.stringify(err));
      });
  }
}, 500);

// Progressive from PLC
setInterval(function () {
  if (connected && runProgressive) {
    client
      .writeSingleRegister(1042, prog)
      .catch((err) => {
        GUI.error(JSON.stringify(err));
      })
      .then((v) => {
        hrCounter++;
        drawGui();
      });
  }
}, 1000);

socket.on("error", (err) => {
  GUI.error(JSON.stringify(err));
});
socket.connect(options);

// draw the SolidOnScreenValues Box
const SolidValuesBox = new Box({
  id: "solidValuesBox",
  x: 2,
  y: 8,
  width: 60,
  height: 8,
  style: {
    boxed: true,
    color: "rgb(191, 64, 191)",
    label: "Solid Registers"
  },
  draggable: false,
});

/**
 * @description Updates the console screen
 *
 */
const updateConsole = async () => {
  const p = new PageBuilder();
  p.addRow({
    text: `Modbus TCP server simulator app! Welcome...`,
    color: "yellow",
  });
  if (connected)
    p.addRow({
      text: `Connected to TCP Server: ${ipAddress}:${port} - id: ${unitId}`,
      color: "green",
    });
  p.addRow(
    { text: `Holding Register Setted: `, color: "magenta" },
    { text: `${hrCounter}`, color: "white" }
  );

  // Print if simulator is running or not
  if (testMode) {
    p.addRow(
      { text: `Test mode is enabled! `, color: "red" },
      { text: `press 't' to disable it`, color: "white" }
    );
    p.addRow(
      { text: `Selected test: `, color: "magenta" },
      { text: `${selectedTest} `, color: "white" },
    );
  } else {
    if (!run) {
      p.addRow(
        { text: `Simulator is not running! `, color: "red" },
        { text: `press 'space' to start`, color: "white" }
      );
    } else {
      p.addRow(
        { text: `Simulator is running! `, color: "green" },
        { text: `press 'space' to stop`, color: "white" }
      );
    }
  }

  // Print if progressive counter is running or not
  if (!runProgressive) {
    p.addRow(
      { text: `Progressive counter [hr1044] is not running! `, color: "red" },
      { text: `press 'p' to start it`, color: "white" }
    );
  } else {
    p.addRow(
      { text: `Progressive counter [hr1044] is running! `, color: "green" },
      { text: `press 'p' to stop it`, color: "white" }
    );
  }

  // Print if progressive counter is running or not
  if (!runRead) {
    p.addRow(
      { text: `HR Reading and parsing is off! `, color: "red" },
      { text: `press 'r' to start it`, color: "white" }
    );
  } else {
    p.addRow(
      { text: `HR Reading and parsing is on!  `, color: "green" },
      { text: `press 'r' to stop it`, color: "white" }
    );
  }

  // Spacer
  p.addSpacer(8);
  if (lastErr.length > 0) {
    p.addRow({ text: lastErr, color: "red" });
  }
  p.addSpacer(1);

  // Print the commands
  p.addRow({ text: `Commands: `, color: "white", bg: "bgBlack" });
  if (testMode) {
    p.addRow(
      { text: `  't'`, color: "white", bold: true },
      { text: `  - disable test mode`, color: "gray", italic: true }
    );
  } else {
    p.addRow(
      { text: `  't'`, color: "white", bold: true },
      { text: `  - enable test mode`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  'space'`, color: "white", bold: true },
      { text: `  - start/stop the simulator`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  'r'`, color: "white", bold: true },
      {
        text: `  - start/stop the HR reading and parsing`,
        color: "gray",
        italic: true,
      }
    );
    p.addRow(
      { text: `  'p'`, color: "white", bold: true },
      {
        text: `  - start/stop progressive counter (PLC isAlive)`,
        color: "gray",
        italic: true,
      }
    );
    p.addRow(
      { text: `  's'`, color: "white", bold: true },
      { text: `  - send command value`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  'g'`, color: "white", bold: true },
      { text: `  - make a glide on channel`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  'h'`, color: "white", bold: true },
      { text: `  - clear all glide actions`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  'o'`, color: "white", bold: true },
      { text: `  - start a oscillation on channel`, color: "gray", italic: true }
    );
    p.addRow(
      { text: `  '1'`, color: "white", bold: true },
      { text: `  - manage active oscillations`, color: "gray", italic: true }
    );
  }
  p.addRow(
    { text: `  'c'`, color: "white", bold: true },
    { text: `  - reconnect to server`, color: "gray", italic: true }
  );
  p.addRow(
    { text: `  'q'`, color: "white", bold: true },
    { text: `  - quit the app`, color: "gray", italic: true }
  );

  p.addSpacer(2);

  const solidValuesPage = new InPageWidgetBuilder()
  for (let v in solidOnscreenValues) {
    solidValuesPage.addRow(
      { text: `${v}: `, color: "white", bg: "bgBlack" },
      { text: `${solidOnscreenValues[v]}`, color: "white", bg: "bgBlack" }
    );
  }
  SolidValuesBox.setContent(solidValuesPage);


  if (!testMode) {
    GUI.setPage(p, 0);
    // run the test
    return;
  }

  const pages = [p, GUI.stdOut];

  // Draw the test watchs and actions
  const watchPage = new PageBuilder();
  watchPage.addRow(
    { text: `Test: ${selectedTest}`, color: "white", bg: "bgBlack" }
  );
  watchPage.addSpacer(1);
  watchPage.addRow(
    { text: `Watchs: `, color: "white", bg: "bgBlack" }
  );
  watchPage.addSpacer(1);
  tests[selectedTest]?.watchs.forEach((watch) => {
    watchPage.addRow(
      { text: `  ${watch.name}: `, color: "white", bg: "bgBlack" },
      { text: `${solidOnscreenValues[watch.modbus]}`, color: "white", bg: "bgBlack" }
    );
  });
  pages.push(watchPage);

  const actionPage = new PageBuilder(35);
  actionPage.addRow(
    { text: `Test: ${selectedTest}`, color: "white", bg: "bgBlack" }
  );
  actionPage.addSpacer(1);
  actionPage.addRow(
    { text: `Actions: `, color: "white", bg: "bgBlack" }
  );

  actionsStartPosition.x = GUI.layout.layout.realWidth[1][0] + (GUI.getLayoutOptions().boxed ? 2 : 0);
  actionsStartPosition.y = Math.max(p.getViewedPageHeight(), GUI.stdOut.getViewedPageHeight()) + (GUI.getLayoutOptions().boxed ? 2 : 0) + actionPage.getViewedPageHeight() + 1;
  actionPage.addSpacer(18);
  updateButtons();

  pages.push(actionPage);

  GUI.setPages(pages, [GUI.applicationTitle, "LOGS", "WATCHS", "ACTIONS"]);
};

const resetTest = () => {
  if (testMode) {
    // Reset the test
    tests[selectedTest]?.actions.forEach((action) => {
      writeCommand(action.modbus, 0);
    });
  }
};

const defineDefaultButton = () => {
  const title = `Reset Test [Ctrl+r]`
  defaultButton = new Button({
    id: "resetTest",
    text: title,
    width: title.length + 2,
    height: 3,
    x: 3,
    y: actionsStartPosition.y + 10,
    style: {
      color: "red",
      borderColor: "rgba(255, 128, 0)",
    },
    key: {
      name: "r",
      ctrl: true,
    },
    visible: true,
    draggable: false
  });
  defaultButton.on("click", () => {
    resetTest();
  });
}

const deleteButtons = () => {
  if (defaultButton) {
    defaultButton.hide()
    defaultButton.delete();
    defaultButton.removeAllListeners();
    //defaultButton = undefined;
  }
  actionsButtons.forEach((button) => {
    button.hide()
    button.delete();
    button.removeAllListeners();
  });
  //actionsButtons = [];
};

const updateButtons = (define = false) => {
  const actions = tests[selectedTest]?.actions || [];
  if (define) {
    defineDefaultButton();
    actionsButtons = actions.map((action, index) => {
      const title = `${action.name} [Ctrl+${action.key}]`
      const button = new Button({
        id: `action_${index}`,
        text: title,
        width: title.length + 2,
        height: 3,
        x: actionsStartPosition.x,
        y: actionsStartPosition.y + (index * 3),
        style: {
          color: action.color,
          borderColor: action.color,
        },
        key: {
          name: action.key,
          ctrl: true,
        },
        visible: true,
        draggable: false
      });
      button.on("click", () => {
        writeCommand(action.modbus, action.value);
      });
      return button;
    });
  } else {
    actionsButtons.forEach((button, index) => {
      button.absoluteValues.x = actionsStartPosition.x;
      button.absoluteValues.y = actionsStartPosition.y + (index * 3);
    });
    defaultButton.absoluteValues.y = actionsStartPosition.y + 10;
  }
}

GUI.on("exit", () => {
  closeApp();
});

GUI.on("layoutratiochanged", () => {
  updateButtons();
});

GUI.on("keypressed", (key) => {
  if (testMode) {
    if (!key.ctrl && key.name === "t") {
      testMode = false;
      runProgressive = false;
      run = false;
      runRead = false;
      deleteButtons();
      GUI.setLayoutOptions({ ...GUI.getLayoutOptions(), type: "double" });
      GUI.warn(`Test mode disabled!`);
      drawGui();
    }
  } else {
    switch (key.name) {
      case "t":
        testMode = true;
        runProgressive = true;
        run = false;
        runRead = true;
        GUI.setLayoutOptions({ ...GUI.getLayoutOptions(), type: "quad" });
        Object.keys(glideStorage.timers).forEach((timer) => {
          clearInterval(glideStorage.timers[timer]);
        });
        deleteButtons();
        updateButtons(true);
        GUI.warn(`Test mode enabled!`);
        drawGui();
        break;
      case "space":
        run = !run;
        drawGui();
        break;
      case "p":
        runProgressive = !runProgressive;
        drawGui();
        break;
      case "r":
        runRead = !runRead;
        drawGui();
        break;
      case "s":
        new OptionPopup({
          id: "popupSelectCommand",
          title: "Select Modbus Channel",
          options: channelsNames,
          selected: selectedChannel,
        })
          .show()
          .on("confirm", (_selectedChannelOsc) => {
            selectedChannelOsc = _selectedChannelOsc;
            GUI.warn(`Selected: ${selectedChannelOsc}`);
            const _chan = channels.find((c) => c.name == selectedChannelOsc);
            if ((_chan && _chan.type === "decimal") || _chan.type === "integer") {
              typedVal = rawChannels[_chan.address];
            } else if (_chan && _chan.type == "bit") {
              typedVal = getSingleBit(rawChannels[_chan.address], _chan.offset);
            }
            new InputPopup({
              id: "popupTypeVal",
              title: `Type value for "${selectedChannelOsc}"`,
              value: typedVal,
              numeric: true
            })
              .show()
              .on("confirm", (_val) => {
                typedVal = _val;
                GUI.warn(`NEW VALUE: ${typedVal}`);
                writeCommand(selectedChannelOsc, typedVal);
                drawGui();
              });
          });
        break;
      case "g":
        {
          new OptionPopup({
            id: "popupSelectCommandGlide",
            title: "[Glide] Select Modbus Channel",
            options: channelsNames,
            selected: selectedChannel,
          })
            .show()
            .on("confirm", (_selectedChannel) => {
              selectedChannel = _selectedChannel;
              GUI.warn(`Selected: ${selectedChannel}`);
              const _chan = channels.find((c) => c.name == selectedChannel);
              if (
                (_chan && _chan.type === "decimal") ||
                _chan.type === "integer"
              ) {
                typedVal = rawChannels[_chan.address];
              } else if (_chan && _chan.type == "bit") {
                typedVal = getSingleBit(rawChannels[_chan.address], _chan.offset);
              }
              new InputPopup({
                id: "popupTypeValFrom",
                title: `Type start value for "${selectedChannel}"`,
                value: glideStorage.from,
                numeric: true
              })
                .show()
                .on("confirm", (_val) => {
                  glideStorage.from = _val;
                  GUI.warn(`FROM: ${glideStorage.from}`);
                  new InputPopup({
                    id: "popupTypeValTo",
                    title: `Type target value for "${selectedChannel}"`,
                    value: glideStorage.to,
                    numeric: true
                  })
                    .show()
                    .on("confirm", (_val) => {
                      glideStorage.to = _val;
                      GUI.warn(`TO: ${glideStorage.to}`);
                      glideStorage.timers[selectedChannel] = glide(
                        selectedChannel,
                        glideStorage.from,
                        glideStorage.to,
                        glideStorage.step
                      );
                      drawGui();
                    });
                });
            });
        }
        break;
      case "h":
        Object.keys(glideStorage.timers).forEach((timer) => {
          clearInterval(glideStorage.timers[timer]);
        });
        break;
      case "o":
        // Sine Oscillator for a specific channel
        new OptionPopup({
          id: "popupSelectCommandOscillator",
          title: "[Oscillator] Select Modbus Channel",
          options: channelsNames,
          selected: selectedChannelOsc
        })
          .show()
          .on("confirm", (_selectedChannel) => {
            selectedChannel = _selectedChannel;
            GUI.warn(`Selected: ${selectedChannel}`);
            const _chan = channels.find((c) => c.name == selectedChannel);
            if (
              (_chan && _chan.type === "decimal") ||
              _chan.type === "integer"
            ) {
              typedVal = rawChannels[_chan.address];
            } else if (_chan && _chan.type == "bit") {
              new ConfirmPopup({
                id: "popupNotSupported",
                title: "Oscillator not supported for bit channels!"
              }).show();
              return;
            }
            oscillatorStorage[selectedChannel] = {
              offset: 0,
              amplitude: 0,
              period: 1000,
              currentTime: 0,
              timer: null,
            }
            new InputPopup({
              id: "popupTypeValFrom",
              title: `Type offset value for "${selectedChannel}"`,
              value: oscillatorStorage[selectedChannel].offset,
              numeric: true
            })
              .show()
              .on("confirm", (_val) => {
                oscillatorStorage[selectedChannel].offset = _val;
                GUI.warn(`OFFSET: ${oscillatorStorage[selectedChannel].offset}`);
                new InputPopup({
                  id: "popupTypeValTo",
                  title: `Type amplitude value for "${selectedChannel}"`,
                  value: oscillatorStorage[selectedChannel].amplitude,
                  numeric: true
                })
                  .show()
                  .on("confirm", (_val) => {
                    oscillatorStorage[selectedChannel].amplitude = _val;
                    GUI.warn(`AMPLITUDE: ${oscillatorStorage[selectedChannel].amplitude}`);
                    new InputPopup({
                      id: "popupTypeValPeriod",
                      title: `Type period value for "${selectedChannel}"`,
                      value: oscillatorStorage[selectedChannel].period,
                      numeric: true
                    })
                      .show()
                      .on("confirm", (_val) => {
                        oscillatorStorage[selectedChannel].period = _val;
                        GUI.warn(`PERIOD: ${oscillatorStorage[selectedChannel].period}`);
                        if (oscillatorStorage[selectedChannel]) {
                          clearInterval(oscillatorStorage[selectedChannel].timers);
                        }
                        oscillatorStorage[selectedChannel].timer = oscillator(
                          selectedChannel,
                          oscillatorStorage[selectedChannel].offset,
                          oscillatorStorage[selectedChannel].amplitude,
                          oscillatorStorage[selectedChannel].period
                        );
                        drawGui();
                      });
                  });
              });
          });
        break;
      case "1":
        // Manage active oscillators
        if (Object.keys(oscillatorStorage).length === 0) {
          new ConfirmPopup({
            id: "popupNoOscillators",
            title: "No oscillators active!"
          }).show();
          return;
        }
        new OptionPopup({
          id: "popupSelectCommandOscillator",
          title: "[Oscillator] Select Modbus Channel",
          options: Object.keys(oscillatorStorage),
          selected: selectedChannelOsc
        })
          .show()
          .on("confirm", (_selectedChannel) => {
            selectedChannelOsc = _selectedChannel;
            GUI.warn(`Selected: ${selectedChannelOsc}`);
            // Ask for delete
            new ConfirmPopup({
              id: "popupDeleteOscillator",
              title: `Are you sure you want to delete "${selectedChannelOsc}"?`
            })
              .show()
              .on("confirm", () => {
                clearInterval(oscillatorStorage[selectedChannelOsc].timer);
                delete oscillatorStorage[selectedChannelOsc];
                drawGui();
              });
          });
        break;
      default:
        break;
    }
  }
  switch (key.name) {
    case "c":
      {
        if (connected) {
          socket.destroy();
          connected = false;
        }
        socket.connect(options);
      }
      break;
    case "q":
      new ConfirmPopup({ id: "popupQuit", title: "Are you sure you want to quit?" })
        .show()
        .on("confirm", () => closeApp());
      break;
    default:
      break;
  }
});


const drawGui = () => {
  updateConsole();
};

const closeApp = () => {
  console.clear();
  process.exit();
};

drawGui();


const defaultWatchs = [
    {
        name: "SOLID STATUS READY",
        modbus: "SOLID STATUS READY",
    },
    {
        name: "SOLID STATUS BUSY",
        modbus: "SOLID STATUS BUSY( TEST ACTIVE / IN PROGRESS)",
    },
]

const defaultEngineWatchs = [
    {
        name: "SOLID ENGINE START REQUEST",
        modbus: "SOLID ENGINE START REQUEST",
    },
    {
        name: "SOLID ENGINE STOP REQUEST",
        modbus: "SOLID ENGINE STOP REQUEST",
    },
]

const startEngine = {
    name: "Set Engine Speed to 1800rpm",
    modbus: "ENGINE SPEED",
    value: 1800,
    color: "green",
    key: "a"
}

const tests = {
    "High Crankcase Pressure Alarm": {
        number: 101,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "HIGH CRANKCASE OIL VAPOR PRESSURE",
                modbus: "HIGH CRANKCASE OIL VAPOR PRESSURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "s"
            },
        ]
    },
    "Low Starting Air Pressure Alarm": {
        number: 102,
        watchs: [
            ...defaultWatchs
        ],
        actions: [
            {
                name: "LOW STARTING AIR PRESSURE",
                modbus: "LOW STARTING AIR PRESSURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "s"
            },
        ]
    },
    "Low Fuel Pressure (Filter Outlet) Alarm": {
        number: 103,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'FUEL PRESSURE (AFTER FILTER)' to 2000",
                modbus: "FUEL PRESSURE (AFTER FILTER)",
                value: 2000,
                color: "yellow",
                key: "s"
            },
            {
                name: "LOW FUEL PRESSURE",
                modbus: "LOW FUEL PRESSURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
        ]
    },
    "Low Lub Oil Gallery Pressure Alarm": {
        number: 104,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'LUB OIL PRESSURE (ENGINE INLET)' to 2000",
                modbus: "LUB OIL PRESSURE (ENGINE INLET)",
                value: 2000,
                color: "yellow",
                key: "s"
            },
            {
                name: "LOW LUB OIL PRESSURE",
                modbus: "LOW LUB OIL PRESSURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
        ]
    },
    "Low Sea Water Pressure Alarm": {
        number: 105,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'SEA WATER PRESSURE (PUMP DISCHARGE)' to 2000",
                modbus: "SEA WATER PRESSURE (PUMP DISCHARGE)",
                value: 2000,
                color: "yellow",
                key: "s"
            },
            {
                name: "LOW SEA WATER PRESSURE",
                modbus: "LOW SEA WATER PRESSURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
        ]
    },
    "High Jacket Water Temperature Alarm": {
        number: 106,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'JACKET WATER TEMPERATURE (BANKS EXIT)' to 80",
                modbus: "JACKET WATER TEMPERATURE (BANKS EXIT)",
                value: 80,
                color: "yellow",
                key: "s"
            },
            {
                name: "HIGH JACKET WATER TEMPERATURE",
                modbus: "HIGH JACKET WATER TEMPERATURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
        ]
    },
    "High Boost Pressure Alarm - Left/Right Bank": {
        number: 107,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'CHARGE AIR PRESSURE (LEFT INTERCOOLER EXIT)' to 1600",
                modbus: "CHARGE AIR PRESSURE (LEFT INTERCOOLER EXIT)",
                value: 1600,
                color: "yellow",
                key: "s"
            },
            {
                name: "HIGH CHARGE AIR PRESSURE LEFT BANK",
                modbus: "HIGH CHARGE AIR PRESSURE LEFT BANK",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
            {
                name: "Set 'CHARGE AIR PRESSURE (RIGHT INTERCOOLER EXIT)' to 1600",
                modbus: "CHARGE AIR PRESSURE (RIGHT INTERCOOLER EXIT)",
                value: 1600,
                color: "yellow",
                key: "s"
            },
            {
                name: "HIGH CHARGE AIR PRESSURE RIGHT BANK",
                modbus: "HIGH CHARGE AIR PRESSURE RIGHT BANK",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
        ]
    },
    "Very Low Piston Cooling Oil Shutdown": {
        number: 108,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'PISTON COOLING OIL PRESSURE (FILTER INLET)' to 1700",
                modbus: "PISTON COOLING OIL PRESSURE (FILTER INLET)",
                value: 1700,
                color: "yellow",
                key: "s"
            },
            {
                name: "DEFAULT SPEED - IDLE/RATED",
                modbus: "DEFAULT SPEED - IDLE/RATED",
                value: 1,
                color: "magenta",
                key: "d"
            },
            {
                name: "VERY LOW COOLING OIL PRESSURE",
                modbus: "VERY LOW COOLING OIL PRESSURE",
                value: 1,
                color: "blue",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "Very High Fresh Water Pressure Shutdown": {
        number: 109,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'JACKET WATER PRESSURE (PUMP DISCHARGE) ' to 1700",
                modbus: "JACKET WATER PRESSURE (PUMP DISCHARGE) ",
                value: 1700,
                color: "yellow",
                key: "s"
            },
            {
                name: "DEFAULT SPEED - IDLE/RATED",
                modbus: "DEFAULT SPEED - IDLE/RATED",
                value: 1,
                color: "magenta",
                key: "d"
            },
            {
                name: "FRESH WATER VERY HIGH PRESSURE",
                modbus: "FRESH WATER VERY HIGH PRESSURE",
                value: 1,
                color: "blue",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "Very High Fuel Rail Pressure Shutdown": {
        number: 110,
        watchs: [
            ...defaultWatchs
        ],
        actions: [
            {
                name: "Set 'RAIL PRESSURE' to 1000",
                modbus: "RAIL PRESSURE",
                value: 1000,
                color: "yellow",
                key: "a"
            },
            {
                name: "HIGH RAIL PRESSURE ",
                modbus: "HIGH RAIL PRESSURE ",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "s"
            },
            {
                name: "VERY HIGH RAIL PRESSURE",
                modbus: "VERY HIGH RAIL PRESSURE",
                value: 1,
                color: "red",
                key: "d"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "f"
            },
        ]
    },
    "Very Low Lube Oil Gallery Pressure Shutdown": {
        number: 111,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'LUB OIL PRESSURE (ENGINE INLET)' to 1700",
                modbus: "LUB OIL PRESSURE (ENGINE INLET)",
                value: 1700,
                color: "yellow",
                key: "s"
            },
            {
                name: "VERY LOW LUB OIL PRESSURE",
                modbus: "VERY LOW LUB OIL PRESSURE",
                value: 1,
                color: "red",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "High Lube Oil Temperature Shutdown": {
        number: 112,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'LUB OIL TEMPERATURE (ENGINE INLET)' to 100",
                modbus: "LUB OIL TEMPERATURE (ENGINE INLET)",
                value: 100,
                color: "yellow",
                key: "s"
            },
            {
                name: "HIGH LUB OIL TEMPERATURE",
                modbus: "HIGH LUB OIL TEMPERATURE",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "d"
            },
            {
                name: "VERY LOW LUB OIL PRESSURE",
                modbus: "VERY LOW LUB OIL PRESSURE",
                value: 1,
                color: "red",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "Very High Jacket Water Temperature Shutdown": {
        number: 113,
        watchs: [
            ...defaultWatchs
        ],
        actions: [
            {
                name: "VERY HIGH JACKET WATER TEMPERATURE",
                modbus: "VERY HIGH JACKET WATER TEMPERATURE",
                value: 1,
                color: "red",
                key: "a"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
        ]
    },
    "High GEN Bearing Temp Test (DE-NDE)": {
        number: 114,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
        ]
    },
    "High GEN Winding Temp Test": {
        number: 115,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
        ]
    },
    "VH Exhaust Temp Shutdown Left Turbo Intake": {
        number: 116,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'EXHAUST TEMP. MANIFOLD A1/2 (LEFT TURBINE INTAKE)' to 100",
                modbus: "EXHAUST TEMP. MANIFOLD A1/2 (LEFT TURBINE INTAKE)",
                value: 100,
                color: "green",
                key: "s"
            },
            {
                name: "Set 'EXHAUST TEMP. MANIFOLD A3/4 (LEFT TURBINE INTAKE)' to 100",
                modbus: "EXHAUST TEMP. MANIFOLD A3/4 (LEFT TURBINE INTAKE)",
                value: 100,
                color: "green",
                key: "d"
            },
            {
                name: "VERY HIGH EXHAUST TEMPERATURE (TURBINES INTAKE)",
                modbus: "VERY HIGH EXHAUST TEMPERATURE (TURBINES INTAKE)",
                value: 1,
                color: "red",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "VH Exhaust Temp Shutdown Right Turbo Intake": {
        number: 116,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "Set 'EXHAUST TEMP. MANIFOLD B1/3 (RIGHT TURBINE INTAKE)' to 100",
                modbus: "EXHAUST TEMP. MANIFOLD B1/3 (RIGHT TURBINE INTAKE)",
                value: 100,
                color: "green",
                key: "s"
            },
            {
                name: "Set 'EXHAUST TEMP. MANIFOLD B2/4 (RIGHT TURBINE INTAKE)' to 100",
                modbus: "EXHAUST TEMP. MANIFOLD B2/4 (RIGHT TURBINE INTAKE)",
                value: 100,
                color: "green",
                key: "d"
            },
            {
                name: "VERY HIGH EXHAUST TEMPERATURE (TURBINES INTAKE)",
                modbus: "VERY HIGH EXHAUST TEMPERATURE (TURBINES INTAKE)",
                value: 1,
                color: "red",
                key: "f"
            },
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "g"
            },
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "h"
            },
        ]
    },
    "LOP Emergency Stop Test": {
        number: 118,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN (RED BUTTON)",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
            {
                name: "EMERGENCY SHUTDOWN (Signal)",
                modbus: "EMERGENCY SHUTDOWN",
                value: 1,
                color: "rgb(255, 128, 0)",
                key: "f"
            },
            {
                name: "Stop Engine",
                modbus: "ENGINE SPEED",
                value: 0,
                color: "rgb(255, 128, 0)",
                key: "g"
            },
        ]
    },
    "Overspeed 1980rpm Test": {
        number: 119,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
            {
                name: "BOSCH OVERSPEED REQUEST",
                modbus: "SOLID 2070 BOSCH OVERSPEED REQUEST",
            }
        ],
        actions: [
            startEngine,
            {
                name: "EMERGENCY SHUTDOWN ",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "s"
            },
        ]
    },
    "Overspeed 2070rpm Test": {
        number: 120,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
            {
                name: "BOSCH OVERSPEED REQUEST",
                modbus: "SOLID 2070 BOSCH OVERSPEED REQUEST",
            }
        ],
        actions: [
            startEngine,
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
        ]
    },
    "Very Low Fresh Water Level Shutdown": {
        number: 121,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
        ]
    },
    "Interwarm Solenoid Valve Shutdown": {
        number: 122,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
        ]
    },
    "Fuel Rail Relief Valve Open Shutdown": {
        number: 123,
        watchs: [
            ...defaultWatchs,
            ...defaultEngineWatchs,
        ],
        actions: [
            startEngine,
            {
                name: "LOAD DISCONNECTION REQUEST",
                modbus: "LOAD DISCONNECTION REQUEST",
                value: 1,
                color: "white",
                key: "s"
            },
            {
                name: "EMERGENCY SHUTDOWN",
                modbus: "EMERGENCY SHUTDOWN ",
                value: 1,
                color: "red",
                key: "d"
            },
        ]
    },
};

const testNames = Object.keys(tests);

module.exports = {
    tests,
    testNames,
};
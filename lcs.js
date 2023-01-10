const defaultWatchs = [
    {
        name: "SOLID STATUS READY",
        modbus: "SOLID STATUS READY",
    },
    {
        name: "SOLID STATUS BUSY",
        modbus: "SOLID STATUS BUSY( TEST ACTIVE / IN PROGRESS)",
    },
    {
        name: "SOLID ENGINE START REQUEST",
        modbus: "SOLID ENGINE START REQUEST",
    },
    {
        name: "SOLID ENGINE STOP REQUEST",
        modbus: "SOLID ENGINE STOP REQUEST",
    },
]

export const tests = {
    "High Crankcase Pressure Alarm": {
        number: 101,
        watchs: [
            ...defaultWatchs
        ],
        actions: [
            {
                name: "Set Engine Speed to 1800rpm",
                modbus: "ENGINE SPEED",
                value: 1800,
                color: "green",
                key: "a"
            },
            {
                name: "HIGH CRANKCASE OIL VAPOR PRESSURE",
                modbus: "HIGH CRANKCASE OIL VAPOR PRESSURE",
                value: 1,
                color: "red",
                key: "s"
            },
        ]
    },
    "Low Starting Air Pressure Alarm": {
        number: 102,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Low Fuel Pressure (Filter Outlet) Alarm": {
        number: 103,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Low Lub Oil Gallery Pressure Alarm": {
        number: 104,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Low Sea Water Pressure Alarm": {
        number: 105,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "High Jacket Water Temperature Alarm": {
        number: 106,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "High Boost Pressure Alarm - Left/Right Bank": {
        number: 107,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very Low Piston Cooling Oil Shutdown": {
        number: 108,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very High Fresh Water Pressure Shutdown": {
        number: 109,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very High Fuel Rail Pressure Shutdown": {
        number: 110,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very Low Lube Oil Gallery Pressure Shutdown": {
        number: 111,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "High Lube Oil Temperature Shutdown": {
        number: 112,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very High Jacket Water Temperature Shutdown": {
        number: 113,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "High GEN Bearing Temp Test (DE-NDE)": {
        number: 114,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "High GEN Winding Temp Test": {
        number: 115,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "VH Exhaust Temp Shutdown Left Turbo Intake": {
        number: 116,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "VH Exhaust Temp Shutdown Right Turbo Intake": {
        number: 116,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "LOP Emergency Stop Test": {
        number: 118,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Overspeed 1980rpm Test": {
        number: 119,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Overspeed 2070rpm Test": {
        number: 120,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Very Low Fresh Water Level Shutdown": {
        number: 121,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Interwarm Solenoid Valve Shutdown": {
        number: 122,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
    "Fuel Rail Relief Valve Open Shutdown": {
        number: 123,
        watchs: [
            ...defaultWatchs
        ],
        actions: []
    },
};

export const testNames = Object.keys(tests);
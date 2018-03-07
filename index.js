module.exports = {
    data: require("./src/data"),
    rest: require("./src/rest"),
    signals: require("./src/signals"),
    system: {
        log: require("./src/system.log"),
        version: require("./src/system.version")
    },
    user: require("./src/user"),
    widgets: {
        AreaChart: require("./src/widgets.areachart"),
        BarChart: require("./src/widgets.barchart"),
        ChordChart: require("./src/widgets.chordchart"),
        Grid: require("./src/widgets.grid"),
        Hint: require("./src/widgets.hint"),
        Histogram: require("./src/widgets.histogram"),
        Info: require("./src/widgets.info"),
        Label: require("./src/widgets.label"),
        Legend: require("./src/widgets.legend"),
        LineChart: require("./src/widgets.linechart"),
        Map: require("./src/widgets.map"),
        Picture: require("./src/widgets.picture"),
        PieChart: require("./src/widgets.piechart"),
        Slider: require("./src/widgets.slider"),
        Status: require("./src/widgets.status")
    }
};

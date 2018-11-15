var width = 260;
var height = 200;

// Area chart
new du.widgets.AreaChart("areachart", "#areachart")
    .width(width)
    .height(height)
    .xLabel("value")
    .yLabel("probability density")
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(12)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: 5 * Math.pow(i / 40, 2)
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: 10 * Math.log(i + 1) * Math.pow(Math.cos(Math.PI * i / 15), 2) + 2
                };
            })
        }
    ])
    .render();

// Bar chart
new du.widgets.BarChart("barchart", "#barchart")
    .width(width)
    .height(height)
    .xLabel("fruit name")
    .yLabel("stock")
    .margins({left: 60, top: 20, right: 20, bottom: 40})
    .fontSize(12)
    .vertical(true)
    .data([
        {name: "plum", value: 13},
        {name: "banana", value: 4},
        {name: "mango", value: 6},
        {name: "orange", value: 2},
        {name: "melon", value: 11},
        {name: "kiwi", value: 7},
        {name: "pear", value: 3}
    ])
    .render();

// Box plot
new du.widgets.BoxPlot("boxplot", "#boxplot")
    .data([
        {
            name: "normal",
            values: new Array(1000).fill(0).map(function() {
                return 5 * Math.sqrt(-2*Math.log(Math.random())) * Math.cos(2*Math.PI*Math.random()) + 20;
            })
        },
        {
            name: "poisson",
            values: new Array(1000).fill(0).map(function() {
                var l = Math.exp(-20),
                    k = 0,
                    p = 1;
                do {
                    k++;
                    p *= Math.random();
                } while (p > l);
                return k - 1;
            })
        }
    ])
    .width(width)
    .height(height)
    .xLabel("type")
    .yLabel("dist")
    .margins(60)
    .fontSize(12)
    .render();

// Bubble chart
new du.widgets.BubbleChart("bubblechart", "#bubblechart")
    .width(width)
    .height(height)
    .xLabel("x")
    .yLabel("y")
    .margins(40)
    .fontSize(14)
    .scale(15)
    .data([
        {name: "blueberry", x: 58, y: 87, size: 0.2},
        {name: "cherry", x: 38, y: 42, size: 0.3},
        {name: "pear", x: 37, y: 66, size: 1},
        {name: "green apple", x: 22, y: 79, size: 1},
        {name: "plum", x: 17, y: 59, size: 0.6}
    ])
    .render();

// Chord chart
new du.widgets.ChordChart("chordchart", "#chordchart")
    .x(width / 2 - height / 2)
    .radius(height / 2)
    .thickness(10)
    .margins(40)
    .fontSize(12)
    .ticks(true)
    .data([
        {source: "melon", target: "plum", value: 1},
        {source: "melon", target: "pear", value: 2},
        {source: "melon", target: "kiwi", value: 3},
        {source: "plum", target: "melon", value: 4},
        {source: "plum", target: "pear", value: 5},
        {source: "plum", target: "kiwi", value: 6},
        {source: "pear", target: "melon", value: 7},
        {source: "pear", target: "plum", value: 8},
        {source: "pear", target: "kiwi", value: 9},
        {source: "kiwi", target: "melon", value: 10},
        {source: "kiwi", target: "plum", value: 11},
        {source: "kiwi", target: "pear", value: 12},
        {source: "orange", target: "plum", value: 1},
        {source: "plum", target: "orange", value: 2}
    ])
    .render();

// Description
d3.select("#description").append("div")
    .style("margin-top", "50px")
    .style("margin-left", "30px")
    .style("width", "auto")
    .style("max-width", "170px")
    .style("padding", "10px")
    .style("background", "white")
    .style("box-shadow", "0 0 1px black")
    .style("border-radius", "3px")
    .style("color", "black")
    .style("font-size", "0.8em")
    .style("line-height", "1.35em")
    .text("This is a chart showing some cool data");

// Grid
var grid = new du.widgets.Grid("grid", "#grid")
    .width(width)
    .height(height)
    .rows(2)
    .cols(2)
    .render();
grid.add(new du.widgets.LineChart("subchart1")
    .margins({left: 30, top: 10, right: 10, bottom: 20})
    .fontSize(10)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.pow(i / 40, 2),
                    dy: i / 100
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.log(i + 1)
                    * Math.pow(Math.cos(Math.PI * i / 15), 2) + 2,
                    dy: .6
                };
            })
        }
    ]), 0, 0, 1, 1);
grid.add(new du.widgets.BarChart("subchart3")
    .margins({left: 50, top: 10, right: 10, bottom: 20})
    .fontSize(10)
    .vertical(true)
    .data([
        {name: "plum", value: 13},
        {name: "banana", value: 4},
        {name: "mango", value: 6},
        {name: "orange", value: 2},
        {name: "melon", value: 11},
        {name: "kiwi", value: 7},
        {name: "pear", value: 3}
    ]), 0, 1, 2, 1);
grid.add(new du.widgets.AreaChart("subchart2")
    .margins({left: 30, top: 10, right: 10, bottom: 20})
    .fontSize(10)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: 5 * Math.pow(i / 40, 2)
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: 10 * Math.log(i + 1) * Math.pow(Math.cos(Math.PI * i / 15), 2) + 2
                };
            })
        }
    ]), 1, 0, 1, 1);

// Hint
new du.widgets.Hint("hint", "#hint")
    .x(70)
    .y(50)
    .text("This is a hint")
    .pin(true)
    .render();

// Histogram
new du.widgets.Histogram("histogram", "#histogram")
    .data(new Array(1000).fill(0).map(function () {
        return Math.exp(1 + Math.random() * 2);
    }))
    .width(width)
    .height(height)
    .xLabel("bins")
    .yLabel("count")
    .margins({left: 60, top: 20, right: 20, bottom: 40})
    .fontSize(12)
    .render();

// Info box
d3.select("#infobox").append("div")
    .style("position", "absolute")
    .style("top", "50px")
    .style("margin-left", "30px")
    .style("width", "auto")
    .style("max-width", "200px")
    .style("padding", "20px")
    .style("box-shadow", "1px 1px 4px grey")
    .style("border-radius", "3px")
    .style("color", "black")
    .style("font-size", "1em")
    .style("line-height", "1.35em")
    .text("This is an example showing the info box widget.");

// Label
new du.widgets.Label("label", "#label")
    .width(width)
    .height(height)
    .label("&ldquo;I have a dream&rdquo;")
    .fontSize(24)
    .fontColor("dodgerblue")
    .render();

// Legend
new du.widgets.Legend("widgets.legend", "#legend")
    .x(40)
    .y(50)
    .width(200)
    .height(150)
    .labels(["plum", "banana", "mango", "orange", "melon", "kiwi", "pear"])
    .fontSize(20)
    .twoColumns(true)
    .render();

// Linear gauge
new du.widgets.LinearGauge("lineargauge", "#lineargauge")
    .width(width)
    .height(height)
    .margins(60)
    .tick(true)
    .fontSize(12)
    .min(0)
    .max(100)
    .tickFormat(function(x) {
        return x.toFixed(0);
    })
    .position(Math.floor(Math.random() * 100))
    .render();


// Line chart
new du.widgets.LineChart("linechart", "#linechart")
    .width(width)
    .height(height)
    .xLabel("days")
    .yLabel("price")
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(12)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.pow(i / 40, 2),
                    dy: i / 100
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.log(i + 1)
                    * Math.pow(Math.cos(Math.PI * i / 15), 2) + 2,
                    dy: .6
                };
            })
        }
    ])
    .render();

// Map
new du.widgets.Map("map", "#map")
    .resource("data/maps/world.json")
    .x(0)
    .y(0)
    .width(width)
    .height(height)
    .backgroundColor("#aac6ff")
    .borderColor("white")
    .foregroundColor("#dc9a2f")
    .render();

// Multi bar chart
new du.widgets.MultiBarChart("widgets.multibarchart", "#multibarchart")
    .width(width)
    .height(height)
    .xLabel("room")
    .yLabel("number")
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(14)
    .barWidth(0.7)
    .data([
        {
            name: "mango",
            values: new Array(4).fill(0).map(function (d, i) {
                return {
                    x: "ABCD".charAt(i),
                    y: Math.floor(Math.random() * 10)
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(4).fill(0).map(function (d, i) {
                return {
                    x: "ABCD".charAt(i),
                    y: 1 + Math.floor(Math.random() * i * 4)
                };
            })
        },
        {
            name: "melon",
            values: new Array(4).fill(0).map(function (d, i) {
                return {
                    x: "ABCD".charAt(i),
                    y: 1 + Math.floor(Math.random() * i)
                };
            })
        }
    ])
    .render();

// Picture
new du.widgets.Picture("widgets.picture", "#picture")
    .width(width)
    .height(height)
    .src("data/macika.png")
    .render();

// Pie chart
new du.widgets.PieChart("piechart", "#piechart")
    .x(30)
    .y(0)
    .innerRadius(30)
    .outerRadius(100)
    .margins(30)
    .fontColor("white")
    .fontSize(14)
    .ticks(true)
    .data([
        {name: "orange", value: 3},
        {name: "mango", value: 4},
        {name: "banana", value: 4},
        {name: "kiwi", value: 2}
    ])
    .render();

// Placeholder
new du.widgets.LineChart("placeholder", "#placeholder")
    .width(width)
    .height(height)
    .xLabel("time")
    .yLabel("trends")
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(14)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.pow(i / 40, 2),
                    dy: i / 100
                };
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i,
                    y: Math.log(i + 1)
                    * Math.pow(Math.cos(Math.PI * i / 15), 2) + 2,
                    dy: .6
                };
            })
        }
    ])
    .render()
    .placeholder("This chart is empty and you see a placeholder instead");

// Progress bar
new du.widgets.ProgressBar("progressbar", "#progressbar")
    .x(0.2 * width)
    .width(0.6 * width)
    .height(height)
    .label("progress: 68%")
    .fontSize(14)
    .trackColor("#ddd")
    .fontColor("dodgerblue")
    .thickness(2)
    .percentage(68)
    .render();

// Scatter plot
new du.widgets.ScatterPlot("scatterplot", "#scatterplot")
    .width(width)
    .height(height)
    .xLabel("x")
    .yLabel("y")
    .margins(40)
    .fontSize(14)
    .tooltip(true)
    .data([
        {
            name: "mango",
            values: new Array(100).fill(0).map(function(d, i) {
                return {
                    x: i + Math.random() - 0.5,
                    y: 10 * Math.pow(i / 40, 2) + Math.random() * 10 - 5
                }
            })
        },
        {
            name: "kiwi",
            values: new Array(100).fill(0).map(function (d, i) {
                return {
                    x: i + Math.random() * 8 - 4,
                    y: 80 * (1 - Math.exp(-i / 30)) + Math.random() * 10 - 5
                }
            })
        }
    ])
    .render();

// Semi-circular gauge
new du.widgets.SemiCircularGauge("semicirculargauge", "#semicirculargauge")
    .width(width)
    .height(height)
    .margins(60)
    .position(0.57)
    .render();

// Slider
new du.widgets.Slider("slider", "#slider")
    .x(10)
    .y(70)
    .width(width - 20)
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(14)
    .position(0.57)
    .render();

// Status
var st = new du.widgets.Status("status", "#status")
    .x(0)
    .y(60)
    .width(170)
    .height(50)
    .margins({left: 40, top: 20, right: 20, bottom: 40})
    .fontSize(20)
    .label("Time:")
    .value(new Date().toLocaleTimeString())
    .render();
setInterval(function () {
    st.value(new Date().toLocaleTimeString())
        .render();
}, 900);

// Trackpad
new du.widgets.TrackPad("trackpad", "#trackpad")
    .x(50)
    .y(30)
    .width(160)
    .height(160)
    .margins(30)
    .fontSize(9)
    .xRange([0, 255])
    .yRange([0, 255])
    .render();

// Violin plot
new du.widgets.ViolinPlot("violinplot", "#violinplot")
    .data([
        {
            name: "normal",
            values: new Array(1000).fill(0).map(function() {
                return 5 * Math.sqrt(-2*Math.log(Math.random())) * Math.cos(2*Math.PI*Math.random()) + 20;
            })
        },
        {
            name: "pareto",
            values: new Array(1000).fill(0).map(function () {
                return 18 / Math.pow(1-Math.random(), 2/20);
            })
        }
    ])
    .width(width)
    .height(height)
    .xLabel("type")
    .yLabel("dist")
    .margins(60)
    .fontSize(12)
    .render();

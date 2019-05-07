/**
 * Module implementing a line chart.
 *
 * @copyright Copyright (C) 2017 Sony Mobile Communications Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * @author Enys Mones (enys.mones@sony.com)
 * @module linechart
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
// TODO add log axes
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.LineChart = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The line chart widget class.
     *
     * @class LineChart
     * @memberOf du.widgets.linechart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function LineChart(name, parent) {
        var _w = Widget.call(this, name, "linechart", "svg", parent);

        /**
         * Sets the lower boundary for the X axis.
         *
         * @method xMin
         * @memberOf du.widgets.linechart.LineChart
         * @param {number} value The value of the lower boundary.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "xMin", null);

        /**
         * Sets the upper boundary for the X axis.
         *
         * @method xMax
         * @memberOf du.widgets.linechart.LineChart
         * @param {number} value The value of the upper boundary.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "xMax", null);

        /**
         * Sets the type of the X axis.
         * Supported values are: number, time, string.
         * Default is number.
         *
         * @method xType
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} type Type of the X axis.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "xType", "number");

        /**
         * Sets line styles for each plot.
         *
         * @method lineStyles
         * @memberOf du.widgets.linechart.LineChart
         * @param {Object} style Object containing the style for each plot. A style is an object with SVG styles to set.
         * Currently only stroke-dasharray is supported.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "lineStyles", null);

        /**
         * Adds smoothing to the curves and error bands. Smoothing is done by using Catmull-Rom splines for each curve.
         * Default is false.
         *
         * @method smooth
         * @memberOf du.widgets.linechart.LineChart
         * @param {boolean} on Whether to add smoothing to the curves.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "smooth", false);

        // Widget elements.
        var _svg = {},
            _data = [],
            _transition = false,
            _colors = {},
            _markers = {},
            _pins = {};

        /**
         * Binds data to the line plot.
         * Expected data format: array containing an object for each plot. A plot object has a {name} property with the
         * name of the plot and a {values} property which is the array of {(x, y)} coordinates. Each data point can have
         * two optional values {lo, hi} representing the error of the {y} value. Default values of {lo} and {hi} for all
         * data points are 0.
         * All plots are sorted by their {x} values before plot.
         *
         * @method data
         * @memberOf du.widgets.linechart.LineChart
         * @param {Array} data Data to plot.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.data = function (data) {
            _data = data.map(function (d) {
                return {
                    name: d.name,
                    values: d.values.sort(function (a, b) {
                        return a.x - b.x;
                    }).map(function (dd) {
                        return {
                            x: dd.x,
                            y: dd.y,
                            lo: dd.lo || 0,
                            hi: dd.hi || 0
                        };
                    })
                };
            });
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.linechart.LineChart
         * @param {(string|string[])} key Single key or an array of keys of the line(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.highlight = function (key, duration) {
            if (!_transition) {
                _w.utils.highlight(this, _svg, ".line", key, duration);
                _w.utils.highlight(this, _svg, ".error", key, duration);
                _w.utils.highlight(this, _svg, ".marker", key, duration);
            }
            return this;
        };

        /**
         * Adjusts marker position.
         *
         * @method _adjustMarker
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} key Identifier of the marker.
         * @param {(number|string)} start Start X position of the marker.
         * @param {(number|string)} end End X position of the marker.
         * @returns {?Object} New marker descriptor if marker exists and could be adjusted, null otherwise.
         * @private
         */
        function _adjustMarker(key, start, end) {
            // Get data
            var data = _data.filter(function (d) {
                return d.name === key;
            })[0];
            if (!data) {
                return null;
            }

            // Get marker data point indices
            var bisect = d3.bisector(function (d) {
                return d.x;
            }).left;
            var i1 = bisect(data.values, start);
            var i2 = bisect(data.values, end);
            if (i1 === null || i2 === null) {
                return null;
            }

            // Get coordinates and color
            var x1 = data.values[i1].x,
                y1 = data.values[i1].y,
                x2 = data.values[i2].x,
                y2 = data.values[i2].y;
            var xCorner = y1 < y2 ? x1 : x2;
            var yCorner = y1 < y2 ? y2 : y1;

            return {
                start: {
                    x: x1,
                    y: y1
                },
                end: {
                    x: x2,
                    y: y2
                },
                corner: {
                    x: xCorner,
                    y: yCorner
                }
            };
        }

        /**
         * Adds a marker to the specified line.
         * A marker is a text along with a 90-degree angle connecting two points of a line.
         * If a marker with the specified identifier already exists, the marker is ignored.
         *
         * @method addMarker
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} id Marker identifier.
         * @param {string} key Key of the line to mark.
         * @param {(number|string)} start Start X position of the marker.
         * @param {(number|string)} end End X position of the marker.
         * @param {string} label Label of the marker.
         * @returns {?object} D3 selection of the marker if it could be added, null otherwise.
         */
        this.addMarker = function (id, key, start, end, label) {
            // Check if marker exists
            if (_markers.hasOwnProperty(id)) {
                return null;
            }

            var pos = _adjustMarker(key, start, end);
            var g = _svg.g.append("g")
                .attr("class", "marker " + _w.utils.encode(key));
            g.append("line")
                .attr("class", "horizontal")
                .attr("x1", _svg.scale.x(Math.max(pos.start.x, _w.attr.xMin ? _w.attr.xMin : pos.start.x)) + 2)
                .attr("y1", _svg.scale.y(pos.corner.y))
                .attr("x2", _svg.scale.x(Math.min(pos.end.x, _w.attr.xMax ? _w.attr.xMax : pos.end.x)) + 2)
                .attr("y2", _svg.scale.y(pos.corner.y))
                .style("stroke", _colors[key])
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
            g.append("line")
                .attr("class", "vertical")
                .attr("x1", _svg.scale.x(pos.corner.x) + 2)
                .attr("y1", _svg.scale.y(pos.start.y))
                .attr("x2", _svg.scale.x(pos.corner.x) + 2)
                .attr("y2", _svg.scale.y(pos.end.y))
                .style("stroke", _colors[key])
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
            g.append("circle")
                .attr("class", "start")
                .attr("cx", _svg.scale.x(pos.start.x) + 2)
                .attr("cy", _svg.scale.y(pos.start.y))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", _colors[key]);
            g.append("circle")
                .attr("class", "end")
                .attr("cx", _svg.scale.x(pos.end.x) + 2)
                .attr("cy", _svg.scale.y(pos.end.y))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", _colors[key]);
            g.append("text")
                .attr("x", _svg.scale.x(pos.corner.x) + 2)
                .attr("y", _svg.scale.y(pos.corner.y))
                .attr("dy", -5)
                .attr("text-anchor", pos.start.y < pos.end.y ? "start" : "end")
                .style("fill", _w.attr.fontColor)
                .style("font-family", "inherit")
                .style("font-size", "0.9em")
                .text(label);

            var marker = {
                key: key,
                g: g,
                update: function (duration) {
                    var pos = _adjustMarker(key, start, end);
                    g.select(".horizontal")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x(Math.max(pos.start.x, _w.attr.xMin ? _w.attr.xMin : pos.start.x)) + 2)
                        .attr("y1", _svg.scale.y(pos.corner.y))
                        .attr("x2", _svg.scale.x(Math.min(pos.end.x, _w.attr.xMax ? _w.attr.xMax : pos.end.x)) + 2)
                        .attr("y2", _svg.scale.y(pos.corner.y))
                        .style("stroke", _colors[this.key]);
                    g.select(".vertical")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x(pos.corner.x) + 2)
                        .attr("y1", _svg.scale.y(pos.start.y))
                        .attr("x2", _svg.scale.x(pos.corner.x) + 2)
                        .attr("y2", _svg.scale.y(pos.end.y))
                        .style("stroke", _colors[this.key]);
                    g.select(".start")
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos.start.x) + 2)
                        .attr("cy", _svg.scale.y(pos.start.y))
                        .style("fill", _colors[this.key]);
                    g.select(".end")
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos.end.x) + 2)
                        .attr("cy", _svg.scale.y(pos.end.y))
                        .style("fill", _colors[this.key]);
                    g.select("text")
                        .transition().duration(duration)
                        .attr("x", _svg.scale.x(pos.corner.x) + 2)
                        .attr("y", _svg.scale.y(pos.corner.y))
                        .attr("text-anchor", pos.start.y < pos.end.y ? "start" : "end")
                        .style("fill", _w.attr.fontColor);
                }
            };

            // Add to markers
            _markers[id] = marker;

            // Return marker
            return marker;
        };

        /**
         * Removes a marker from the plot.
         *
         * @method removeMarker
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} id Identifier of the marker to remove.
         * @returns {boolean} True if marker exists and could be removed, false otherwise.
         */
        this.removeMarker = function (id) {
            if (_markers.hasOwnProperty(id)) {
                _markers[id].g.remove();
                delete _markers[id];
                return true;
            }
            return false;
        };

        /**
         * Adds a pin to the specified line.
         * A pin is a vertical line with a circle on top denoting a specific location in the chart.
         * If a pin with the specified identifier already exists, the pin is ignored.
         *
         * @method addPin
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} id Pin identifier.
         * @param {(number|string)} pos Pin position on the X axis.
         * @param {string} color Pin color. Defaults to font color.
         * @param {string} size Pin head radius. Default is 4 pixels.
         * @param {string} height Height of the pin relative to the vertical range. Defaults to 1.
         * @returns {?object} D3 selection of the pin if it could be added, null otherwise.
         */
        this.addPin = function(id, pos, color, size, height) {
            // Check if pin exists
            if (_pins.hasOwnProperty(id)) {
                return null;
            }

            // Add pin
            var g = _svg.g.append("g")
                .attr("class", "pin");
            g.append("line")
                .attr("class", "pin-needle")
                .attr("x1", _svg.scale.x(pos) + 2)
                .attr("y1", _svg.scale.y.range()[0])
                .attr("x2", _svg.scale.x(pos) + 2)
                .attr("y2", (1 - (height || 1)) * _svg.scale.y.range()[0])
                .style("stroke", color || _w.attr.fontColor)
                .style("stroke-width", 1);
            g.append("circle")
                .attr("class", "pin-head")
                .attr("cx", _svg.scale.x(pos) + 2)
                .attr("cy", (1 - (height || 1)) * _svg.scale.y.range()[0])
                .attr("r", (size || 6) + "px")
                .style("stroke", "white")
                .style("stroke-width", "2px")
                .style("fill", color || _w.attr.fontColor);

            var pin = {
                g: g,
                update: function (duration) {
                    g.select(".pin-needle")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x(pos) + 2)
                        .attr("y1", _svg.scale.y.range()[0])
                        .attr("x2", _svg.scale.x(pos) + 2)
                        .attr("y2", (1 - (height || 1)) * _svg.scale.y.range()[0]);
                    g.select(".pin-head")
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos) + 2)
                        .attr("cy", (1 - (height || 1)) * _svg.scale.y.range()[0]);
                }
            };

            // Add to pins
            _pins[id] = pin;

            // Return pin
            return pin;
        };

        /**
         * Removes a pin from the plot.
         *
         * @method removePin
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} id Identifier of the pin to remove.
         * @returns {boolean} True if pin exists and could be removed, false otherwise.
         */
        this.removePin = function(id) {
            if (_pins.hasOwnProperty(id)) {
                _pins[id].g.remove();
                delete _pins[id];
                return true;
            }
            return false;
        };

        // Tooltip builder
        _w.utils.tooltip = function (mouse) {
            // Get bisection
            var bisect = d3.bisector(function (d) {
                return _svg.scale.x(d.x);
            }).left;
            var index = mouse ? _data.map(function (d) {
                return bisect(d.values, mouse[0]);
            }) : null;

            // If no data point is found, just remove tooltip elements
            if (index === null) {
                for (var t in this.tt) {
                    if (this.tt.hasOwnProperty(t))
                        this.tt[t].remove();
                }
                this.tt = null;
                return;
            } else {
                this.tt = this.tt || {};
                var tt = this.tt;
            }

            // Get plots
            var x = _svg.scale.x.invert(mouse[0]);
            var plots = _data.map(function (d, i) {
                // Data point
                var j = index[i],
                    data = d.values,
                    left = data[j - 1] ? data[j - 1] : data[j],
                    right = data[j] ? data[j] : data[j - 1],
                    point = x - left.x > right.x - x ? right : left;
                x = point.x;

                // Marker
                var mx = _svg.scale.x.invert(mouse[0]),
                    ip = d3.interpolateNumber(left.y, right.y),
                    y = ip((mx - left.x) / (right.x - left.x));
                tt[d.name] = tt[d.name] || _svg.g.append("circle");
                tt[d.name]
                    .attr("cx", mouse[0] + 2)
                    .attr("cy", _svg.scale.y(!isNaN(y) ? y : left.y))
                    .attr("r", 4)
                    .style("fill", _colors[d.name]);

                return {
                    name: d.name,
                    color: _colors[d.name],
                    dashed: _w.attr.lineStyles && _w.attr.lineStyles[d.name] ? true : undefined,
                    value: _w.attr.tooltipYFormat(point.y)
                };
            });

            return {
                title: _w.attr.tooltipXFormat(x),
                content: {
                    type: "plots",
                    data: plots
                }
            };
        };

        // Builder
        _w.render.build = function () {
            _svg = _w.utils.standardAxis();
            _svg.plots = {};
        };

        // Data updater
        _w.render.update = function (duration) {
            // Filter data
            var data = _data.map(function (d) {
                return {
                    name: d.name,
                    values: d.values.filter(function(dd) {
                        return (_w.attr.xMax === null || dd.x <= _w.attr.xMax)
                            && (_w.attr.xMin === null || dd.x >= _w.attr.xMin);
                    })
                };
            });

            // Get data boundaries
            var fullData = data.reduce(function (a, d) {
                return a.concat(d.values);
            }, []);
            var yMin = d3.min(fullData, function(d) {
                return d.y - (d.lo ? d.lo : 0);
            });
            var yMax = d3.max(fullData, function(d) {
                return d.y + (d.hi ? d.hi : 0);
            });

            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, (_w.attr.xMin ? [{x: _w.attr.xMin}] : []).concat(_w.attr.xMax ? [{x: _w.attr.xMax}] : [])
                ).map(function (d) {
                    return d.x;
                }), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, []).map(function (d) {
                    return d.y;
                }).concat([yMin, yMax]), [_w.attr.innerHeight, 0])
            };

            // Calculate line/error function
            var line = d3.line()
                .x(function (d) {
                    return _svg.scale.x(d.x) + 2;
                })
                .y(function (d) {
                    return _svg.scale.y(d.y);
                })
                .curve(_w.attr.smooth ? d3.curveCatmullRom : d3.curveLinear);
            var error = d3.area()
                .x(function (d) {
                    return _svg.scale.x(d.x) + 2;
                }).y0(function (d) {
                    return _svg.scale.y(Math.max(d.y - d.lo, yMin));
                }).y1(function (d) {
                    return _svg.scale.y(Math.min(d.y + d.hi, yMax));
                })
                .curve(_w.attr.smooth ? d3.curveCatmullRom : d3.curveLinear);

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x
                    .tickValues(_w.attr.xTicks)
                    .scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y
                    .tickValues(_w.attr.yTicks)
                    .scale(_svg.scale.y));

            // Build/update error bands
            _colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);
            _svg.plots.errors = _svg.g.selectAll(".error")
                .data(data, function (d) {
                    return d.name;
                });
            _svg.plots.errors.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.errors = _svg.plots.errors.enter().append("path")
                .attr("class", function (d) {
                    return "error " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("opacity", 0)
                .style("stroke", "none")
                .style("fill", "transparent")
                .merge(_svg.plots.errors)
                .each(function () {
                    _transition = true;
                })
                .on("mouseover", function (d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function (d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d.name);
                })
                .transition().duration(duration)
                .attr("d", function (d) {
                    return error(d.values);
                })
                .style("opacity", 1)
                .style("fill-opacity", 0.2)
                .style("fill", function (d) {
                    return _colors[d.name];
                });

            // Build/update lines
            _svg.plots.lines = _svg.g.selectAll(".line")
                .data(data, function (d) {
                    return d.name;
                });
            _svg.plots.lines.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.lines.enter()
                .append("path")
                .attr("class", function (d) {
                    return "line " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("opacity", 0)
                .style("fill", "none")
                .merge(_svg.plots.lines)
                .each(function () {
                    _transition = true;
                })
                .on("mouseover", function (d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function (d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d.name);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("d", function (d) {
                    return line(d.values);
                })
                .style("stroke-width", "2px")
                .style("stroke-dasharray", function(d) {
                    return _w.attr.lineStyles && _w.attr.lineStyles[d.name] ? _w.attr.lineStyles[d.name] : null;
                })
                .style("stroke", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });

            // Markers
            for (var marker in _markers) {
                if (_markers.hasOwnProperty(marker)) {
                    _markers[marker].update(duration);
                }
            }

            // Pins
            for (var pin in _pins) {
                if (_pins.hasOwnProperty(pin)) {
                    _pins[pin].update(duration);
                }
            }
        };

        // Style updater
        _w.render.style = function () {
            // Chart (using conventional margins)
            _svg.g
                .attr("width", _w.attr.innerWidth + "px")
                .attr("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axisFn.x.tickFormat(_w.attr.xTickFormat);
            _svg.axes.x
                .attr("transform", "translate(0," + _w.attr.innerHeight + ")");
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > line")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width", "1px");

            // Labels
            _svg.labels.x
                .attr("x", _w.attr.innerWidth + "px")
                .attr("y", (_w.attr.innerHeight + 2.5 * _w.attr.fontSize) + "px")
                .style("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .style("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);
        };
    }

    // Export
    LineChart.prototype = Object.create(Widget.prototype);
    return LineChart;
}));
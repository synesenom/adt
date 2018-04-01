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
 * @requires lodash@4.17.4
 * @requires du.Widget
 */
// TODO add log axes
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('./widget'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'lodash', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.LineChart = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The line chart widget class.
     *
     * @class LineChart
     * @memberOf du.widgets.linechart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function LineChart(name, parent) {
        var _w = Widget.call(this, name, "linechart", "svg", parent);

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
         * Adds a legend to the line chart (experimental feature).
         * Legend is added to the right side of the chart and eats up 20% of the widget,
         * therefore margin.right should be adjusted accordingly.
         * Default is false.
         * Note: this method is still experimental, and therefore it is unstable.
         *
         * @method legend
         * @memberOf du.widgets.linechart.LineChart
         * @param {boolean} on Whether legend should be added.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        _w.attr.add(this, "legend", false);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _scaleFactor = 1.0;
        var _markers = {};

        /**
         * Binds data to the line plot.
         * Expected data format: array of objects with properties {x} and {y}, where {x} is a number or time, {y}
         * is an object containing the values for each quantity to plot. Each data point can optionally contain a {dy}
         * property with the errors corresponding to the keys in {y}.
         * Data is sorted by the {x} values.
         *
         * @method data
         * @memberOf du.widgets.linechart.LineChart
         * @param {Array} data Data to plot.
         * @param {number} scale Optional scaling parameter. Each data point is divided by this value.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.data = function(data, scale) {
            var realScale = scale || 1;
            _data = data.sort(function (a, b) {
                return a.x - b.x;
            }).map(function(d) {
                var s = {x: d.x, y: {}};
                _.forOwn(d.y, function(v, k) {
                    s.y[k] = v / realScale;
                });
                if (d.dy) {
                    s.dy = {};
                    _.forOwn(d.dy, function(v, k) {
                        s.dy[k] = v / realScale;
                    });
                }
                return s;
            });

            // Scale data
            if (typeof scale === "number" && scale > 0)
                _scaleFactor = scale;
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.linechart.LineChart
         * @param {string} key Key of the line to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.highlight = function(key, duration) {
            _w.utils.highlight(this, _svg, ".line", key, duration);
            _w.utils.highlight(this, _svg, ".error", key, duration);
            _w.utils.highlight(this, _svg, ".marker", key, duration);
            return this;
        };
        var highlight = this.highlight;

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
        this.addMarker = function(id, key, start, end, label) {
            // Check if marker exists
            if (_markers.hasOwnProperty(id)) {
                return null;
            }

            // Get Y coordinates
            var row1 = _data.filter(function(d) {
                return d.x - start === 0;
            })[0];
            if (!row1 || !row1.hasOwnProperty('y') || !row1.y.hasOwnProperty(key))
                return null;
            var y1 = row1.y[key];
            var row2 = _data.filter(function(d) {
                return d.x - end === 0;
            })[0];
            if (!row2 || !row2.hasOwnProperty('y') || !row2.y.hasOwnProperty(key))
                return null;
            var y2 = row2.y[key];

            // Get color
            var color = typeof _w.attr.colors === "string" ? _w.attr.colors : _w.attr.colors[key];

            // Add marker
            var xCorner = y1 < y2 ? start : end;
            var yCorner = y1 < y2 ? y2 : y1;
            var marker = {
                start: {
                    x: start,
                    y: y1
                },
                end: {
                    x: end,
                    y: y2
                },
                corner: {
                    x: xCorner,
                    y: yCorner
                },
                g: _svg.g.append("g")
                    .attr("class", "marker " + _w.utils.encode(key))
            };
            marker.g.append("line")
                .attr("class", "horizontal")
                .attr("x1", _svg.scale.x(start)+2)
                .attr("y1", _svg.scale.y(yCorner))
                .attr("x2", _svg.scale.x(end)+2)
                .attr("y2", _svg.scale.y(yCorner))
                .style("stroke", color)
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
           marker.g.append("line")
                .attr("class", "vertical")
                .attr("x1", _svg.scale.x(xCorner)+2)
                .attr("y1", _svg.scale.y(y1))
                .attr("x2", _svg.scale.x(xCorner)+2)
                .attr("y2", _svg.scale.y(y2))
                .style("stroke", color)
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
            marker.g.append("circle")
                .attr("class", "start")
                .attr("cx", _svg.scale.x(start)+2)
                .attr("cy", _svg.scale.y(y1))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", color);
            marker.g.append("circle")
                .attr("class", "end")
                .attr("cx", _svg.scale.x(end)+2)
                .attr("cy", _svg.scale.y(y2))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", color);
            marker.g.append("text")
                .attr("x", _svg.scale.x(xCorner)+2)
                .attr("y", _svg.scale.y(yCorner))
                .attr("dy", -5)
                .attr("text-anchor", y1 < y2 ? "start" : "end")
                .style("fill", _w.attr.fontColor)
                .style("font-family", "inherit")
                .style("font-size", "0.9em")
                .text(label);

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
        this.removeMarker = function(id) {
            if (_markers.hasOwnProperty(id)) {
                _markers[id].g.remove();
                delete _markers[id];
                return true;
            }
            return false;
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {
            // Get bisection
            var bisect = d3.bisector(function (d) {
                return _svg.scale.x(d.x);
            }).left;
            var i = mouse ? bisect(_data, mouse[0]) : null;

            // If no data point is found, just remove tooltip elements
            if (i === null) {
                _.forOwn(this.tt, function(tt) {
                    tt.remove();
                });
                this.tt = null;
                return;
            } else {
                this.tt = this.tt || {};
                var tt = this.tt;
            }

            // Get data entry
            var left = _data[i - 1] ? _data[i - 1] : _data[i];
            var right = _data[i] ? _data[i] : _data[i - 1];
            var point = mouse[0] - left.x > right.x - mouse[0] ? right : left;

            // Build tooltip content
            // Build tooltip content
            var plots = [];
            _.forOwn(point.y, function(yk, k) {
                plots.push({id: k, color: _w.attr.colors[k], value: yk.toPrecision(6)});

                // Update markers
                tt[k] = tt[k] || _svg.g.append("circle");
                tt[k]
                    .attr("r", 4)
                    .attr("cx", _svg.scale.x(_data[i].x)+2)
                    .attr("cy", _svg.scale.y(_data[i].y[k]))
                    .style("fill", _w.attr.colors[k]);
            });
            return {
                title: _w.attr.xLabel + ": " + point.x,
                content: {
                    type: "plots",
                    data: plots
                }
            };
        };

        // Builder
        _w.render.build = function() {
            // Add widget
            _svg.g = _w.widget.append("g");

            // Axes
            _svg.axisFn = {
                x: d3.axisBottom()
                    .ticks(7),
                y: d3.axisLeft()
                    .ticks(5)
            };
            _svg.axes = {
                x: _svg.g.append("g")
                    .attr("class", "x axis"),
                y: _svg.g.append("g")
                    .attr("class", "y axis")
            };

            // Labels
            _svg.labels = {
                x: _svg.g.append("text")
                    .attr("class", "x axis-label")
                    .attr("text-anchor", "end")
                    .attr("stroke-width", 0),
                y: _svg.g.append("text")
                    .attr("class", "y axis-label")
                    .attr("text-anchor", "begin")
                    .attr("stroke-width", 0)
            };

            // Legend
            if (_w.attr.legend) {
                var legend = _svg.g.append("g")
                    .attr("class", "legend");
                var y = 0;
                _.forOwn(_svg.lines, function(lk, k) {
                    var g = legend.append("g")
                        .style("cursor", "pointer")
                        .on("mouseover", function() {
                            highlight(k);
                        })
                        .on("mouseleave", function() {
                            highlight();
                        });
                    g.append("rect")
                        .attr("x", _w.attr.width*0.8)
                        .attr("y", y)
                        .attr("width", _w.attr.fontSize)
                        .attr("height", _w.attr.fontSize)
                        .style("fill", typeof _w.attr.colors === "string" ? _w.attr.colors : _w.attr.colors[k])
                        .style("stroke", "none");
                    g.append("text")
                        .attr("x", _w.attr.width*0.83)
                        .attr("y", y)
                        .attr("dy", 0.8*_w.attr.fontSize)
                        .attr("text-anchor", "start")
                        .style("fill", _w.attr.fontColor)
                        .attr("font-family", "inherit")
                        .attr("font-size", _w.attr.fontSize + "px")
                        .text(k);
                    y += _w.attr.height*0.08;
                });
            }
        };

        // Data updater
        _w.render.update = function(duration) {
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data.map(function(d) {
                    return d.x;
                }), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.map(function (d) {
                    return d3.values(d.y);
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [_w.attr.innerHeight, 0])
            };

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Update plots
            if (_data.length > 0) {
                // Add lines if needed
                if (_svg.lines === undefined) {
                    // Error bands
                    _svg.errors = {};
                    _.forOwn(_data[0].y, function (yk, k) {
                        _svg.errors[k] = _svg.g.append("path")
                            .attr("class", "error " + _w.utils.encode(k))
                            .style("fill-opacity", 0.2)
                            .style("stroke-width", "0px")
                            .style("shape-rendering", "geometricPrecision");
                    });

                    // Add lines
                    _svg.lines = {};
                    _.forOwn(_data[0].y, function (yk, k) {
                        _svg.lines[k] = _svg.g.append("path")
                            .attr("class", "line " + _w.utils.encode(k))
                            .style("fill", "none")
                            .style("stroke-width", "2px")
                            .style("shape-rendering", "geometricPrecision");
                    });
                }

                // Update data
                _.forOwn(_data[0].y, function (yk, k) {
                    if (_data[0].hasOwnProperty('dy') && _data[0].dy.hasOwnProperty(k)) {
                        var error = d3.area()
                            .x(function (d) {
                                return _svg.scale.x(d.x) + 2;
                            }).y0(function (d) {
                                return _svg.scale.y(Math.max(d.y[k] - d.dy[k], 0));
                            }).y1(function (d) {
                                return _svg.scale.y(Math.min(d.y[k] + d.dy[k], _svg.scale.y.domain()[1]));
                            });
                        _svg.errors[k]
                            .transition().duration(duration)
                            .attr("d", error(_data));
                    }
                    var line = d3.line()
                        .x(function (d) {
                            return _svg.scale.x(d.x) + 2;
                        })
                        .y(function (d) {
                            return _svg.scale.y(d.y[k]);
                        });
                    _svg.lines[k]
                        .transition().duration(duration)
                        .attr("d", line(_data));
                });
            }
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data[0] ? d3.keys(_data[0].y) : null);

            // Inner dimensions
            var innerWidth = _w.attr.width - _w.attr.margins.left - _w.attr.margins.right,
                innerHeight = _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom;

            // Chart (using conventional margins)
            _svg.g
                .attr("width", innerWidth + "px")
                .attr("height", innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axes.x
                .attr("transform", "translate(0," + innerHeight + ")");
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > line")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width", "1px");

            // Labels
            _svg.labels.x
                .attr("x", innerWidth + "px")
                .attr("y", (innerHeight + 2.2*_w.attr.fontSize) + "px")
                .style("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .style("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);

            // Plot
            _.forOwn(_svg.errors, function(lk, k) {
                _svg.errors[k]
                    .style("fill", typeof _w.attr.colors === "string" ? _w.attr.colors : _w.attr.colors[k])
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(k);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(k);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(k);
                    });
            });
            _.forOwn(_svg.lines, function(lk, k) {
                _svg.lines[k]
                    .style("stroke", typeof _w.attr.colors === "string" ? _w.attr.colors : _w.attr.colors[k])
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(k);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(k);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(k);
                    });
            });

            // Markers
            _.forOwn(_markers, function(marker) {
                marker.g.select(".horizontal")
                    .attr("x1", _svg.scale.x(marker.start.x)+2)
                    .attr("y1", _svg.scale.y(marker.corner.y))
                    .attr("x2", _svg.scale.x(marker.end.x)+2)
                    .attr("y2", _svg.scale.y(marker.corner.y));
                marker.g.select(".vertical")
                    .attr("x1", _svg.scale.x(marker.corner.x)+2)
                    .attr("y1", _svg.scale.y(marker.start.y))
                    .attr("x2", _svg.scale.x(marker.corner.x)+2)
                    .attr("y2", _svg.scale.y(marker.end.y));
                marker.g.select(".start")
                    .attr("cx", _svg.scale.x(marker.start.x)+2)
                    .attr("cy", _svg.scale.y(marker.start.y));
                marker.g.select(".end")
                    .attr("cx", _svg.scale.x(marker.end.x)+2)
                    .attr("cy", _svg.scale.y(marker.end.y));
                marker.g.select("text")
                    .attr("x", _svg.scale.x(marker.corner.x)+2)
                    .attr("y", _svg.scale.y(marker.corner.y))
                    .attr("text-anchor", marker.start.y < marker.end.y ? "start" : "end")
                    .style("fill", _w.attr.fontColor)
            });

            // Tooltip

        };
    }

    // Export
    LineChart.prototype = Object.create(Widget.prototype);
    return LineChart;
}));
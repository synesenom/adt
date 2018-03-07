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
// TODO make marker separate widget
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
         */
        _w.attr.add(this, "legend", false);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _scaleFactor = 1.0;
        var _markers = {};

        /**
         * Binds data to the line plot.
         * Data must be an array of {x: number, y: object} where y is an object containing the Y values for each line
         * to plot. The data can optionally contain a {dy} property that corresponds to the error drawn around the line.
         * Error is only drawn for lines that are defined as property in {dy}.
         *
         * @method data
         * @memberOf du.widgets.linechart.LineChart
         * @param {Array} data Array of data points.
         * @param {number} scale Optional scaling parameter. Each data point is divided by this value.
         */
        this.data = function(data, scale) {
            _data = data;

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
         */
        this.highlight = function(key, duration) {
            _w.utils.highlight(_svg, ".line", key, duration);
            _w.utils.highlight(_svg, ".error", key, duration);
            _w.utils.highlight(_svg, ".marker", key, duration);
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
            var i = bisect(_data, mouse[0]);

            // Get data entry
            var left = _data[i - 1] ? _data[i - 1] : _data[i];
            var right = _data[i] ? _data[i] : _data[i - 1];
            var point = mouse[0] - left.x > right.x - mouse[0] ? right : left;

            // Build tooltip content
            var content = d3.select(document.createElement("div"));
            content.append("div")
                .style('position', "relative")
                .style("width", "calc(100% - 10px)")
                .style("line-height", "11px")
                .style("margin", "5px")
                .style("margin-bottom", "10px")
                .style("border-bottom", "solid 1px " + _w.attr.fontColor)
                .text(_w.attr.xLabel + ": " + point.x);
            _.forOwn(point.y, function(y, yi) {
                var entry = content.append("div")
                    .style("position", "relative")
                    .style("max-width", "150px")
                    .style("height", "10px")
                    .style("margin", "5px")
                    .style("padding-right", "10px");
                entry.append("div")
                    .style("position", "relative")
                    .style("width", "10px")
                    .style("height", "10px")
                    .style("float", "left")
                    .style("background-color", _w.attr.colors[yi]);
                entry.append("div")
                    .style("position", "relative")
                    .style("width", "calc(100% - 20px)")
                    .style("height", "10px")
                    .style("float", "right")
                    .style("line-height", "11px")
                    .text(y.toPrecision(6));
            });
            return content.node().innerHTML;
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
            // Prepare data
            var data = _.cloneDeep(_data);
            data.sort(function (a, b) {
                return a.x - b.x;
            });
            for (var i = 0; i < data.length; i++) {
                for (var y in data[i].y) {
                    if (data[i].y.hasOwnProperty(y))
                        data[i].y[y] /= _scaleFactor;

                    // Check if we have error
                    if (data[i].hasOwnProperty('dy') && data[i].dy.hasOwnProperty(y)) {
                        data[i].dy[y] /= _scaleFactor;
                    }
                }
            }

            // Calculate scale
            var boundary = _w.utils.boundary(data, {y: [_w.attr.yMin, null]})
            _svg.scale = _w.utils.scale(boundary,
                _w.attr.width - _w.attr.margins.left - _w.attr.margins.right,
                _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom,
                {x: {type: _w.attr.xType}});

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Update plots
            if (data.length > 0) {
                // Add lines if needed
                if (_svg.lines === undefined) {
                    // Error bands
                    _svg.errors = {};
                    _.forOwn(data[0].y, function (yk, k) {
                        _svg.errors[k] = _svg.g.append("path")
                            .attr("class", "error " + _w.utils.encode(k))
                            .style("fill-opacity", 0.2)
                            .style("stroke-width", "0px")
                            .style("shape-rendering", "geometricPrecision");
                    });

                    // Add lines
                    _svg.lines = {};
                    _.forOwn(data[0].y, function (yk, k) {
                        _svg.lines[k] = _svg.g.append("path")
                            .attr("class", "line " + _w.utils.encode(k))
                            .style("fill", "none")
                            .style("stroke-width", "2px")
                            .style("shape-rendering", "geometricPrecision");
                    });
                }

                // Update data
                _.forOwn(data[0].y, function (yk, k) {
                    if (data[0].hasOwnProperty('dy') && data[0].dy.hasOwnProperty(k)) {
                        var error = d3.area()
                            .x(function (d) {
                                return _svg.scale.x(d.x) + 2;
                            }).y0(function (d) {
                                return _svg.scale.y(Math.max(d.y[k] - d.dy[k], boundary.y.min));
                            }).y1(function (d) {
                                return _svg.scale.y(Math.min(d.y[k] + d.dy[k], boundary.y.max));
                            });
                        _svg.errors[k]
                            .transition().duration(duration)
                            .attr("d", error(data));
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
                        .attr("d", line(data));
                });
            }
        };

        // Style updater
        _w.render.style = function() {
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
                .attr("y", (innerHeight + 35) + "px")
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
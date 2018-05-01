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
     * @extends {du.widget.Widget}
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

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _transition = false;
        var _colors = {};
        var _markers = {};

        /**
         * Binds data to the line plot.
         * Expected data format: array containing an object for each plot. A plot object has a {name} property with the
         * name of the plot and a {values} property which is the array of {(x, y)} coordinates. Each data point can have
         * an optional {dy} value representing the error of the {y} value. Default value of {dy} for all data points is
         * 0.
         * All plots are sorted by their {x} values before plot.
         *
         * @method data
         * @memberOf du.widgets.linechart.LineChart
         * @param {Array} data Data to plot.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.data = function(data) {
            _data = data.map(function(d) {
                return {
                    name: d.name,
                    values: d.values.sort(function (a, b) {
                        return a.x - b.x;
                    }).map(function(dd) {
                        return {
                            x: dd.x,
                            y: dd.y,
                            dy: dd.dy || 0
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
         * @param {string} key Key of the line to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.linechart.LineChart} Reference to the current LineChart.
         */
        this.highlight = function(key, duration) {
            if (!_transition) {
                _w.utils.highlight(this, _svg, ".line", key, duration);
                _w.utils.highlight(this, _svg, ".error", key, duration);
                _w.utils.highlight(this, _svg, ".marker", key, duration);
            }
            return this;
        };

        function _adjustMarker(key, start, end) {
            // Get data
            var data = _data.filter(function(d) {
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
        this.addMarker = function(id, key, start, end, label) {
            // Check if marker exists
            if (_markers.hasOwnProperty(id)) {
                return null;
            }

            var pos = _adjustMarker(key, start, end);
            var g = _svg.g.append("g")
                .attr("class", "marker " + _w.utils.encode(key));
            g.append("line")
                .attr("class", "horizontal")
                .attr("x1", _svg.scale.x(pos.start.x)+2)
                .attr("y1", _svg.scale.y(pos.corner.y))
                .attr("x2", _svg.scale.x(pos.end.x)+2)
                .attr("y2", _svg.scale.y(pos.corner.y))
                .style("stroke", _colors[key])
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
           g.append("line")
                .attr("class", "vertical")
               .attr("x1", _svg.scale.x(pos.corner.x)+2)
               .attr("y1", _svg.scale.y(pos.start.y))
               .attr("x2", _svg.scale.x(pos.corner.x)+2)
               .attr("y2", _svg.scale.y(pos.end.y))
                .style("stroke", _colors[key])
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
            g.append("circle")
                .attr("class", "start")
                .attr("cx", _svg.scale.x(pos.start.x)+2)
                .attr("cy", _svg.scale.y(pos.start.y))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", _colors[key]);
            g.append("circle")
                .attr("class", "end")
                .attr("cx", _svg.scale.x(pos.end.x)+2)
                .attr("cy", _svg.scale.y(pos.end.y))
                .attr("r", 4)
                .style("stroke", "none")
                .style("fill", _colors[key]);
            g.append("text")
                .attr("x", _svg.scale.x(pos.corner.x)+2)
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
                update: function(duration) {
                    var pos = _adjustMarker(key, start, end);
                    g.select(".horizontal")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x(pos.start.x)+2)
                        .attr("y1", _svg.scale.y(pos.corner.y))
                        .attr("x2", _svg.scale.x(pos.end.x)+2)
                        .attr("y2", _svg.scale.y(pos.corner.y))
                        .style("stroke", _colors[this.key]);
                    g.select(".vertical")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x(pos.corner.x)+2)
                        .attr("y1", _svg.scale.y(pos.start.y))
                        .attr("x2", _svg.scale.x(pos.corner.x)+2)
                        .attr("y2", _svg.scale.y(pos.end.y))
                        .style("stroke", _colors[this.key]);
                    g.select(".start")
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos.start.x)+2)
                        .attr("cy", _svg.scale.y(pos.start.y))
                        .style("fill", _colors[this.key]);
                    g.select(".end")
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos.end.x)+2)
                        .attr("cy", _svg.scale.y(pos.end.y))
                        .style("fill", _colors[this.key]);
                    g.select("text")
                        .transition().duration(duration)
                        .attr("x", _svg.scale.x(pos.corner.x)+2)
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
            var index = mouse ? _data.map(function(d) {
                return bisect(d.values, mouse[0]);
            }) : null;

            // If no data point is found, just remove tooltip elements
            if (index === null) {
                _.forOwn(this.tt, function(tt) {
                    tt.remove();
                });
                this.tt = null;
                return;
            } else {
                this.tt = this.tt || {};
                var tt = this.tt;
            }

            // Get plots
            var plots = _data.map(function(d, i) {
                var j = index[i];
                var data = d.values;
                var left = data[j - 1] ? data[j - 1] : data[j];
                var right = data[j] ? data[j] : data[j - 1];
                var point = mouse[0] - left.x > right.x - mouse[0] ? right : left;

                tt[d.name] = tt[d.name] || _svg.g.append("circle");
                tt[d.name]
                    .attr("cx", _svg.scale.x(point.x)+2)
                    .attr("cy", _svg.scale.y(point.y))
                    .attr("r", 4)
                    .style("fill", _colors[d.name]);

                return {name: d.name, color: _colors[d.name], value: point.y.toPrecision(6)};
            });

            return {
                title: _w.attr.xLabel + ": " + _svg.scale.x.invert(mouse[0]).toFixed(2),
                content: {
                    type: "plots",
                    data: plots
                }
            };
        };

        // Builder
        _w.render.build = function() {
            _svg = _w.utils.standardAxis();
            _svg.plots = {};
        };

        // Data updater
        _w.render.update = function(duration) {
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, []).map(function (d) {
                    return d.x;
                }), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, []).map(function (d) {
                    return d.y;
                }), [_w.attr.innerHeight, 0])
            };

            // Calculate line/error function
            var line = d3.line()
                .x(function (d) {
                    return _svg.scale.x(d.x) + 2;
                })
                .y(function (d) {
                    return _svg.scale.y(d.y);
                });
            var error = d3.area()
                .x(function (d) {
                    return _svg.scale.x(d.x) + 2;
                }).y0(function (d) {
                    return _svg.scale.y(Math.max(d.y - d.dy, 0));
                }).y1(function (d) {
                    return _svg.scale.y(Math.min(d.y + d.dy, _svg.scale.y.domain()[1]));
                });

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Build/update error bands
            _colors = _w.utils.colors(_data ? _data.map(function(d){ return d.name; }) : null);
            _svg.plots.errors = _svg.g.selectAll(".error")
                .data(_data, function(d) {
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
                .on("mouseover", function(d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function(d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function(d) {
                    _w.attr.click && _w.attr.click(d.name);
                })
            .merge(_svg.plots.errors)
                .each(function() {
                    _transition = true;
                })
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("d", function (d) {
                    return error(d.values);
                })
                .style("fill-opacity", 0.2)
                .style("fill", function(d) {
                    return _colors[d.name];
                });

            // Build/update lines
            _svg.plots.lines = _svg.g.selectAll(".line")
                .data(_data, function(d) {
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
                .each(function() {
                    _transition = true;
                })
                .on("mouseover", function(d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function(d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function(d) {
                    _w.attr.click && _w.attr.click(d.name);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("d", function (d) {
                    return line(d.values);
                })
                .style("stroke-width", "2px")
                .style("stroke", function(d) {
                    return _colors[d.name];
                })
                .on("end", function() {
                    _transition = false;
                });

            // Markers
            _.forOwn(_markers, function(marker) {
                marker.update(duration);
            });
        };

        // Style updater
        _w.render.style = function() {
            // Chart (using conventional margins)
            _svg.g
                .attr("width", _w.attr.innerWidth + "px")
                .attr("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
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
                .attr("y", (_w.attr.innerHeight + 2.2*_w.attr.fontSize) + "px")
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
/**
 * Module implementing an area chart.
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
 * @module areachart
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires lodash@4.17.4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'lodash', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.AreaChart = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The area chart widget class.
     *
     * @class AreaChart
     * @memberOf du.widgets.areachart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function AreaChart(name, parent) {
        var _w = Widget.call(this, name, "areachart", "svg", parent);

        /**
         * Sets the type of the X axis.
         * Supported values are: number, time, string.
         * Default is number.
         *
         * @method xType
         * @memberOf du.widgets.areachart.AreaChart
         * @param {string} type Type of the X axis.
         * @returns {du.widget.Widget} Reference to the current widget.
         */
        _w.attr.add(this, "xType", "number");

        /**
         * Sets the opacity of the area plots.
         * Default is 0.3.
         *
         * @method opacity
         * @memberOf du.widgets.areachart.AreaChart
         * @param {number} value The opacity value to set.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
         */
        _w.attr.add(this, "opacity", 0.4);

        // Widget elements.
        var _svg = {};
        var _data = [];

        /**
         * Binds data to the area plot.
         * Expected data format: array of objects with properties {x} and {y}, where {x} is a number or time, {y}
         * is an object containing the values for each quantity to plot.
         * Data is sorted by the {x} values.
         *
         * @method data
         * @memberOf du.widgets.areachart.AreaChart
         * @param {Array} data Data to plot.
         * @param {number} scale Optional scaling parameter. Each data point is divided by this value.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
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
                return s;
            });
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.areachart.AreaChart
         * @param {string} key Key of the area to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".area", key, duration);
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
            var plots = [];
            _.forOwn(point.y, function(yk, k) {
                plots.push({id: k, color: _w.attr.colors[k], value: yk.toPrecision(6)});

                // Update markers
                tt[k] = tt[k] || _svg.g.append("circle");
                tt[k]
                    .attr("r", 4)
                    .attr("cx", _svg.scale.x(_data[i].x)+1)
                    .attr("cy", _svg.scale.y(_data[i].y[k])+1)
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
        };

        // Data updater
        _w.render.update = function(duration) {
            // Calculate scale
            _svg.scale = _w.utils.scale(_w.utils.boundary(_data),
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
            if (_data.length > 0) {
                // Add areas if needed
                if (_svg.areas === undefined) {
                    _svg.areas = {};
                    _.forOwn(_data[0].y, function (yk, k) {
                        _svg.areas[k] = _svg.g.append("path")
                            .attr("class", "area " + _w.utils.encode(k))
                            .style("shape-rendering", "geometricPrecision");
                    });
                }

                // Update data
                _.forOwn(_data[0].y, function (yk, k) {
                    var area = d3.area()
                        .x(function (d) {
                            return _svg.scale.x(d.x) + 1;
                        })
                        .y0(_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom)
                        .y1(function (d) {
                            return _svg.scale.y(d.y[k]);
                        });
                    _svg.g.select(".area." + _w.utils.encode(k))
                        .transition().duration(duration)
                        .attr("d", area(_data));
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
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);

            // Plot
            _.forOwn(_svg.areas, function(ak, k) {
                _svg.areas[k]
                    .style("fill-opacity", _w.attr.opacity)
                    .style("fill", _w.attr.colors[k])
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
        };
    }

    // Export
    AreaChart.prototype = Object.create(Widget.prototype);
    return AreaChart;
}));
/**
 * Module implementing an interactive multi-plot bar chart.
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
 * @module multibarchart
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.MultiBarChart = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The bar chart widget class.
     *
     * @class MultiBarChart
     * @memberOf du.widgets.multibarchart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function MultiBarChart(name, parent) {
        var _w = Widget.call(this, name, "multibarchart", "svg", parent);

        /**
         * Sets the total bar width (all plots together) relative to the default.
         * Default is an almost tight-packed bar chart.
         *
         * @method barWidth
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {boolean} barWidth The bar width relative to the default.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        _w.attr.add(this, "barWidth", false);

        /**
         * Enables sorting of data by the X axis.
         * Default is false.
         *
         * @method sortByX
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {boolean} sort Whether to sort data by the X values.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        _w.attr.add(this, "sortByX", false);

        // Widget elements
        var _svg = {};
        var _data = [];
        var _colors = {};
        var _current = null;
        var _transition = false;

        /**
         * Binds data to the bar chart.
         * Expected data format: array containing an object for each plot. A plot object has a {name} property with the
         * name of the plot and a {values} property which is the array of {(x, y)} coordinates. Each data point can have
         * two optional values {lo, hi} representing the error of the {y} value. Default values of {lo} and {hi} for all
         * data points are 0.
         * Note that the data is sorted by the X values assuming they are strings.
         *
         * @method data
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {object} data Data to plot.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        this.data = function (data) {
            _data = data.map(function (d) {
                return {
                    name: d.name,
                    values: d.values.map(function (dd) {
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
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {(string|string[])} key Single key or an array of keys of the bar(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".bar", key, duration);
            return this;
        };

        /**
         * Highlights the sepcified range.
         *
         * @method highlightRange
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {number[]} range Array containing the lower and upper boundary of the range to highlight.
         * @param {?number} duration Duration of the highlight animation.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        this.highlightRange = function(range, duration) {
            if (!_transition) _w.utils.highlightRange(this, _svg, ".bar", range, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function () {
            if (!_current) {
                return null;
            }

            // Get plots
            var x = _current.x;
            var plots = _data.map(function (d) {
                var value = d.values.filter(function(v) {
                    return v.x === x;
                });
                return {
                    name: d.name,
                    color: _colors[d.name],
                    value: value.length > 0 ? _w.attr.tooltipYFormat(value[0].y) : 'n/a'
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
            var data = _data.slice();

            // Calculate scale
            var xData = data.reduce(function (a, d) {
                return a.concat(d.values);
            }, []).map(function (d) {
                return d.x;
            });
            if (_w.attr.sortByX) {
                xData.sort(function(a, b) {
                    return a.localeCompare(b);
                });
            }
            _svg.scale = {
                x: _w.utils.scale(xData, [0, _w.attr.innerWidth], "band"),
                y: _w.utils.scale(data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, []).map(function (d) {
                    return d.y;
                }).concat([0]), [_w.attr.innerHeight, 0])
            };

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Build/update error bands
            _colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);

            // Groups
            _svg.plots.groups = _svg.g.selectAll(".bar-group")
                .data(_data, function (d) {
                    return d.name;
                });
            _svg.plots.groups.exit()
                .transition().duration(duration)
                .remove();
            var groups = _svg.plots.groups.enter().append("g")
                .attr("class", function (d) {
                    return "bar-group " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("stroke", "none")
                .style("fill", "transparent");
            _svg.plots.groups = groups.merge(_svg.plots.groups)
                .each(function () {
                    _transition = true;
                });
            _svg.plots.groups
                .transition().duration(duration)
                .style("fill-opacity", _w.attr.opacity)
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });

            // Bars
            var bandWidth = _data.length > 0 ? _svg.scale.x.bandwidth() : 1,
                width = bandWidth * _w.attr.barWidth,
                dx = bandWidth * (1 - _w.attr.barWidth) / 2;
            _svg.plots.bars = _svg.plots.groups.selectAll(".bar")
                .data(function (d, i) {
                    return d.values.map(function (v) {
                        return {
                            name: d.name,
                            n: data.length,
                            i: i,
                            x: v.x,
                            y: v.y
                        };
                    });
                });
            _svg.plots.bars.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.bars.enter().append("rect")
                .attr("class", function(d) { return "bar " + _w.utils.encode(d.name); })
                .style("opacity", 0)
                .attr("x", function (d) {
                    return _svg.scale.x(d.x) + dx + width * d.i / d.n;
                })
                .attr("y", _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom)
                .attr("width", function (d) {
                    return width / d.n;
                })
                .attr("height", 0)
                .merge(_svg.plots.bars)
                .on("mouseover", function (d) {
                    _current = d;
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function (d) {
                    _current = null;
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d.name);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("x", function (d) {
                    return _svg.scale.x(d.x) + dx + width * d.i / d.n;
                })
                .attr("y", function (d) {
                    return _svg.scale.y(d.y);
                })
                .attr("width", function (d) {
                    return width / d.n;
                })
                .attr("height", function (d) {
                    return _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - _svg.scale.y(d.y);
                });
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
                .attr("y", (_w.attr.innerHeight + 2.2 * _w.attr.fontSize) + "px")
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
    MultiBarChart.prototype = Object.create(Widget.prototype);
    return MultiBarChart;
}));
/**
 * Module implementing an interactive bar chart.
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
 * @module barchart
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
        global.du.widgets.BarChart = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The bar chart widget class.
     *
     * @class BarChart
     * @memberOf du.widgets.barchart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function BarChart(name, parent) {
        var _w = Widget.call(this, name, "barchart", "svg", parent);

        /**
         * Makes the bar chart vertical, effectively swapping the axes.
         * Default is false.
         *
         * @method vertical
         * @memberOf du.widgets.barchart.BarChart
         * @param {boolean} vertical Whether to set bar chart to vertical.
         * @returns {du.widgets.barchart.BarChart} Reference to the current BarChart.
         */
        _w.attr.add(this, "vertical", false);

        // Widget elements
        var _svg = {};
        var _data = [];
        var _colors = {};
        var _transition = false;

        /**
         * Binds data to the bar chart.
         * Expected data format: array of objects with properties {name} (name of the bar) and {value} (corresponding
         * number).
         *
         * @method data
         * @memberOf du.widgets.barchart.BarChart
         * @param {object} data Data to plot.
         * @returns {du.widgets.barchart.BarChart} Reference to the current BarChart.
         */
        this.data = function (data) {
            _data = data;
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.barchart.BarChart
         * @param {(string|string[])} key Single key or an array of keys of the bar(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.barchart.BarChart} Reference to the current BarChart.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".bar", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function (mouse) {
            // Get bisection
            var dir = _w.attr.vertical ? 1 : 0;
            var bisect = d3.bisector(function (d) {
                return _svg.scale.x(d.name);
            }).right;
            var i = mouse ? bisect(_data, mouse[dir]) : null;

            // If no mouse is given, just remove tooltip elements
            if (i === null) {
                return;
            }

            // Get data entry
            var left = _data[i - 1] ? _data[i - 1] : _data[i];
            var right = _data[i] ? _data[i] : _data[i - 1];
            var point = mouse[dir] - left.name > right.name - mouse[dir] ? right : left;

            // Build tooltip content
            return {
                title: point.name,
                stripe: _w.attr.colors[point.name],
                content: {
                    type: "metrics",
                    data: [
                        {label: _w.attr.yLabel + ":", value: _w.attr.tooltipYFormat(point.value)}
                    ]
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
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data.map(function (d) {
                    return d.name;
                }).reverse(), [_w.attr.vertical ? _w.attr.innerHeight : _w.attr.innerWidth, 0], "band"),
                y: _w.utils.scale([0, d3.max(_data, function (d) {
                    return d.value;
                })], _w.attr.vertical ? [0, _w.attr.innerWidth] : [_w.attr.innerHeight, 0])
            };

            // Axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x
                    .tickValues(_w.attr.xTicks)
                    .scale(_w.attr.vertical ? _svg.scale.y : _svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y
                    .tickValues(_w.attr.yTicks)
                    .scale(_w.attr.vertical ? _svg.scale.x : _svg.scale.y));

            // Plot
            _colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);
            _svg.plots.bars = _svg.g.selectAll(".bar")
                .data(_data, function (d) {
                    return d.name;
                });
            _svg.plots.bars.exit()
                .transition().duration(duration)
                .style('opacity', 0)
                .remove();
            var enter = _svg.plots.bars.enter().append("rect")
                .attr("class", function (d) {
                    return "bar " + _w.utils.encode(d.name);
                })
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .style("pointer-events", "all")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke", "none");
            if (_w.attr.vertical) {
                enter
                    .attr("y", function (d) {
                        return _svg.scale.x(d.name);
                    })
                    .attr("height", _svg.scale.x.bandwidth())
                    .attr("x", 1)
                    .attr("width", 0);
            } else {
                enter
                    .attr("x", function (d) {
                        return _svg.scale.x(d.name);
                    })
                    .attr("width", _svg.scale.x.bandwidth())
                    .attr("y", _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom)
                    .attr("height", 0);
            }
            var union = enter.merge(_svg.plots.bars)
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
                });
            if (_w.attr.vertical) {
                union = union
                    .transition().duration(duration)
                    .attr("y", function (d) {
                        return _svg.scale.x(d.name);
                    })
                    .attr("height", _svg.scale.x.bandwidth())
                    .attr("x", 1)
                    .attr("width", function (d) {
                        return _svg.scale.y(d.value);
                    });
            } else {
                union = union
                    .transition().duration(duration)
                    .attr("x", function (d) {
                        return _svg.scale.x(d.name);
                    })
                    .attr("width", _svg.scale.x.bandwidth())
                    .attr("y", function (d) {
                        return _svg.scale.y(d.value);
                    })
                    .attr("height", function (d) {
                        return _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - _svg.scale.y(d.value);
                    });
            }
            union
                .style("opacity", 1)
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });
        };

        // Style updater
        _w.render.style = function () {
            // Chart
            _svg.g
                .style("width", _w.attr.innerWidth + "px")
                .style("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            if (_w.attr.vertical) {
                _svg.axisFn.x.tickFormat(_w.attr.yTickFormat);
            } else {
                _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            }
            _svg.axes.x
                .attr("transform", "translate(0," + _w.attr.innerHeight + ")");
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > text")
                .attr("cursor", "default")
                .style("pointer-events", "all");
            if (_w.attr.vertical) {
                _svg.g.selectAll(".y.axis .tick > line")
                    .style("display", "none");
            }
            if (typeof _w.attr.xTickAngle === "number") {
                _svg.g.selectAll(".x.axis .tick > text")
                    .attr("transform", "rotate(" + _w.attr.xTickAngle + ")")
                    .style("text-anchor", "start");
            }
            _svg.g.selectAll(".tick > line")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width", "1px");

            // Labels
            _svg.labels.x
                .attr("x", _w.attr.innerWidth + "px")
                .attr("y", (_w.attr.innerHeight + 2.2 * _w.attr.fontSize) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.vertical ? _w.attr.yLabel : _w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.vertical ? _w.attr.xLabel : _w.attr.yLabel);
        };
    }

    // Export
    BarChart.prototype = Object.create(Widget.prototype);
    return BarChart;
}));

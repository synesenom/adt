/**
 * Module implementing an interactive pie chart.
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
 * @module piechart
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires lodash@4.17.4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('./widget'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'lodash', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.PieChart = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The pie chart widget class.
     *
     * @class PieChart
     * @memberOf du.widgets.piechart
     * @param {string} name Identifier of the pie chart.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function PieChart(name, parent) {
        var _w = Widget.call(this, name, "piechart", "svg", parent);

        /**
         * Sets the inner radius in pixels.
         * Default is 0.
         *
         * @method innerRadius
         * @memberOf du.widgets.piechart.PieChart
         * @param {number} size Size of the inner radius in pixels.
         * @returns {du.widgets.piechart.PieChart} Reference to the current PieChart.
         */
        _w.attr.add(this, "innerRadius", 0, "dim");

        /**
         * Sets the outer radius in pixels.
         * Default is 50.
         *
         * @method outerRadius
         * @memberOf du.widgets.piechart.PieChart
         * @param {number} size Size of the outer radius in pixels.
         * @returns {du.widgets.piechart.PieChart} Reference to the current PieChart.
         */
        _w.attr.add(this, "outerRadius", 50, "dim");

        /**
         * Adds values as small labels inside the chart.
         *
         * @method ticks
         * @memberOf du.widgets.piechart.PieChart
         * @param {boolean} add Adds ticks.
         * @returns {du.widgets.piechart.PieChart} Reference to the current PieChart.
         */
        _w.attr.add(this, "ticks", false);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _current = null;

        /**
         * Binds new data to pie chart.
         * Expected data format: object with property names as the categories and properties as the values.
         * Data is sorted by the category values in descending order.
         *
         * @method data
         * @memberOf du.widgets.piechart.PieChart
         * @param {object} data Data to plot.
         * @returns {du.widgets.piechart.PieChart} Reference to the current PieChart.
         */
        this.data = function (data) {
            // Transform data to array
            _data = [];
            _.forOwn(data, function(v, k) {
                _data.push({name: k, value: v});
            });

            // Sort by category name
            _data.sort(function(a, b) {
                return b.value - a.value;
            });
            return this;
        };

        /**
         * Highlights the specified slice.
         *
         * @method highlight
         * @memberOf du.widgets.piechart.PieChart
         * @param {string} key Key of the segment to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.piechart.PieChart} Reference to the current PieChart.
         */
        this.highlight = function(key, duration) {
            _w.utils.highlight(this, _svg, "path", key, duration);
            _w.utils.highlight(this, _svg, "text", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function() {
            return _current ? {
                title: _current.name,
                content: {
                    type: "metrics",
                    data: [
                        {label: "value:", value: _current.value},
                        {label: "fraction:", value: (100 * _current.value / d3.sum(_data, function(d) {
                            return d.value;
                        })).toFixed(2) + "%"}
                    ]
                }
            } : null;
        };

        // Builder
        _w.render.build = function() {
            // Add chart itself
            _svg.g = _w.widget.append("g");

            // Add label
            _svg.label = _svg.g.append("text")
                .attr("text-anchor", "middle")
                .attr("stroke-width", "0px")
                .style("fill", "white");

            // Add slices
            _svg.arc = d3.arc();
            _svg.pie = d3.pie()
                .value(function (d) {
                    return d.value;
                })
                .sort(null);

            _svg.arcs = _svg.g.selectAll(".arc")
                .data(_svg.pie(_data))
                .enter().append("g")
                .attr("class", "arc");
            _svg.paths = _svg.arcs.append("path")
                .attr("class", function (d) {
                    return _w.utils.encode(d.data.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("pointer-events", "all")
                .each(function (d) {
                    this._current = d;
                });
            if (_w.attr.ticks) {
                _svg.labelArc = d3.arc();
                _svg.ticks = _svg.arcs.append("text")
                    .attr("class", function (d) {
                        return _w.utils.encode(d.data.name);
                    })
                    .style("text-anchor", "middle")
                    .attr("dy", "0.35em")
                    .each(function (d) {
                        this._current = d;
                    });
            }
        };

        // Data updater
        _w.render.update = function (duration) {
            _svg.arcs.datum(_data);
            _svg.paths.data(_svg.pie(_data))
                .transition().duration(duration)
                .attrTween("d", function (a) {
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function (t) {
                        return _svg.arc(i(t));
                    };
                });
            if (_w.attr.ticks) {
                _svg.ticks.data(_svg.pie(_data))
                    .text(function (d) {
                        return _w.attr.tickFormat(100 * d.data.value / d3.sum(_data, function(dd) {
                            return dd.value;
                        }));
                    })
                    .transition().duration(duration)
                    .attrTween("transform", function (d) {
                        var i = d3.interpolate(this._current, d);
                        this._current = i(0);
                        return function (t) {
                            return "translate(" + _svg.labelArc.centroid(i(t)) + ")";
                        };
                    });
            }
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);

            // Calculate radii
            var outerRadius = _w.attr.outerRadius - _w.attr.margins.left;
            _w.attr.width = 2 * _w.attr.outerRadius;
            _w.attr.height = 2 * _w.attr.outerRadius;

            // Widget
            _w.widget
                .style("width", _w.attr.width + "px")
                .style("height", _w.attr.height + "px");

            // Chart
            _svg.g
                .attr("transform", "translate(" + _w.attr.outerRadius + "," + _w.attr.outerRadius + ")");

            // Plot
            _svg.arc.outerRadius(outerRadius)
                .innerRadius(_w.attr.innerRadius);
            _svg.paths
                .attr("d", _svg.arc)
                .attr("fill", function (d) {
                    return _w.attr.colors[d.data.name];
                });

            // Ticks
            if (_w.attr.ticks) {
                _svg.labelArc.outerRadius(0.5 * (_w.attr.innerRadius + outerRadius))
                    .innerRadius(0.5 * (_w.attr.innerRadius + outerRadius));
                _svg.ticks
                    .attr("d", _svg.labelArc)
                    .attr("fill", _w.attr.fontColor)
                    .style("pointer-events", "none");
            }

            // Label
            _svg.label
                .attr("transform", "translate(0," + _w.attr.outerRadius + ")")
                .style("width", (10 + 2 * _w.attr.outerRadius) + "px")
                .style("font-size", Math.min(16, _w.attr.outerRadius * 0.4) + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.label);

            // Interactions
            _svg.paths
                .on("mouseover", function (d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.data.name);
                })
                .on("mouseleave", function (d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.data.name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d.data.name);
                })
                .on("mousemove", function (d) {
                    _current = d.data;
                });
        };
    }

    // Export
    PieChart.prototype = Object.create(Widget.prototype);
    return PieChart;
}));
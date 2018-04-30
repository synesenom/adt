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
         * Sets the opacity of the area plots.
         * Default is 0.3.
         *
         * @method opacity
         * @memberOf du.widgets.areachart.AreaChart
         * @param {number} value The opacity value to set.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
         */
        _w.attr.add(this, "opacity", 0.3);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _colors = {};
        var _transition = false;

        /**
         * Binds data to the area plot.
         * Expected data format: array of objects with properties {x} and {y}, where {x} is a number or time, {y}
         * is an object containing the values for each quantity to plot.
         * Data is sorted by the {x} values.
         *
         * @method data
         * @memberOf du.widgets.areachart.AreaChart
         * @param {Array} data Data to plot.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
         */
        this.data = function(data) {
            var sorted = data.sort(function (a, b) {
                return a.x - b.x;
            });
            _data = d3.keys(data[0].y).map(function(id) {
                return {
                    id: id,
                    values: sorted.map(function(d) {
                        return {
                            x: d.x,
                            y: d.y[id]
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
         * @memberOf du.widgets.areachart.AreaChart
         * @param {string} key Key of the area to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.areachart.AreaChart} Reference to the current AreaChart.
         */
        this.highlight = function(key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".area", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {
            // Get bisections
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
            var x = 0;
            var plots = _data.map(function(d, i) {
                var j = index[i];
                var data = d.values;
                var left = data[j - 1] ? data[j - 1] : data[j];
                var right = data[j] ? data[j] : data[j - 1];
                var point = mouse[0] - left.x > right.x - mouse[0] ? right : left;
                x = point.x;

                tt[d.id] = tt[d.id] || _svg.g.append("circle");
                tt[d.id]
                    .attr("r", 4)
                    .attr("cx", _svg.scale.x(point.x)+1)
                    .attr("cy", _svg.scale.y(point.y)+1)
                    .style("fill", _colors[d.id]);

                return {id: d.id, color: _colors[d.id], value: point.y.toPrecision(6)};
            });

            return {
                title: _w.attr.xLabel + ": " + x,
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

            // Calculate area function
            var area = d3.area()
                .x(function (d) {
                    return _svg.scale.x(d.x) + 1;
                })
                .y0(_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom)
                .y1(function (d) {
                    return _svg.scale.y(d.y);
                });

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Build/update plots
            _colors = _w.utils.colors(_data ? _data.map(function(d){ return d.id; }) : null);
            _svg.plots.areas = _svg.g.selectAll(".area")
                .data(_data, function(d) {
                    return d.id;
                });
            _svg.plots.areas.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.areas.enter().append("path")
                .attr("class", function (d) {
                    return "area " + _w.utils.encode(d.id);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("opacity", 0)
                .style("stroke", "none")
                .style("fill", "transparent")
            .merge(_svg.plots.areas)
                .each(function() {
                    _transition = true;
                })
                .on("mouseover", function(d) {
                    _w.attr.mouseover && _w.attr.mouseover(d.id);
                })
                .on("mouseleave", function(d) {
                    _w.attr.mouseleave && _w.attr.mouseleave(d.id);
                })
                .on("click", function(d) {
                    _w.attr.click && _w.attr.click(d.id);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("d", function (d) {
                    return area(d.values);
                })
                .style("fill-opacity", _w.attr.opacity)
                .style("fill", function(d) {
                    return _colors[d.id];
                })
                .on("end", function() {
                    _transition = false;
                });
        };

        // Style updater
        _w.render.style = function() {
            // Chart
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
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);
        }
    }

    // Export
    AreaChart.prototype = Object.create(Widget.prototype);
    return AreaChart;
}));
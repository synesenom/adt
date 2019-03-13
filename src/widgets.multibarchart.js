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

        /**
         * Sets X domain for the multi bar chart. The order of the values specified in the domain are used to sort the
         * data in the chart. Default is off.
         *
         * @method xDomain
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {(number[]|string[])} domain Array containing the domain values.
         * @returns {du.widgets.multibarchart.MultiBarChart} Reference to the current BarChart.
         */
        _w.attr.add(this, 'xDomain', null);

        // Widget elements
        var _svg = {};
        var _data = [];
        var _colors = {};
        var _current = null;
        var _transition = false;
        var _markers = {};

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

        /**
         * Adjusts marker position.
         *
         * @method _adjustMarker
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {string} key Identifier of the marker.
         * @param {number} value Y position of the marker line.
         * @returns {?Object} New marker descriptor if marker exists and could be adjusted, null otherwise.
         * @private
         */
        function _adjustMarker(key, value) {
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
         * Adds a marker to the chart.
         * A marker is a horizontal line with a label.
         * If a marker with the specified identifier already exists, the marker is ignored.
         *
         * @method addMarker
         * @memberOf du.widgets.multibarchart.MultiBarChart
         * @param {string} id Marker identifier.
         * @param {(number|string)} value Y value (height) of the marker line.
         * @param {string} label Label of the marker.
         * @param {string} pos Position of the label relative to the marker line. Default is 0.
         * @param {string} color Color of the marker. Default is the font color.
         * @param {string} anchor Text anchor. Supported values: start, middle, right. Default is start.
         * @returns {?object} D3 selection of the marker if it could be added, null otherwise.
         */
        this.addMarker = function (id, value, label, pos, color, anchor) {
            // Check if marker exists
            if (_markers.hasOwnProperty(id)) {
                return null;
            }

            // Add marker
            var g = _svg.g.append("g")
                .attr("class", "marker");
            var usedAnchor = anchor && ["start", "middle", "end"].indexOf(anchor) > -1 ? anchor : "start";
            g.append("line")
                .attr("class", "horizontal")
                .attr("x1", _svg.scale.x.range()[0])
                .attr("y1", _svg.scale.y(value))
                .attr("x2", _svg.scale.x.range()[1])
                .attr("y2", _svg.scale.y(value))
                .style("stroke", color || _w.attr.fontColor)
                .style("stroke-dasharray", "3 3")
                .style("stroke-width", 1);
            g.append("text")
                .attr("x", _svg.scale.x.range()[0] + (pos || 0) * (_svg.scale.x.range()[1] - _svg.scale.x.range()[0]))
                .attr("y", _svg.scale.y(value))
                .attr("dy", -5)
                .attr("text-anchor", "start")
                .style("fill", color || _w.attr.fontColor)
                .style("font-family", "inherit")
                .style("font-size", "0.9em")
                .style("text-anchor", usedAnchor)
                .text(label);

            // Set update method
            var marker = {
                g: g,
                update: function (duration) {
                    g.select(".horizontal")
                        .transition().duration(duration)
                        .attr("x1", _svg.scale.x.range()[0])
                        .attr("y1", _svg.scale.y(value))
                        .attr("x2", _svg.scale.x.range()[1])
                        .attr("y2", _svg.scale.y(value));
                    g.select("text")
                        .transition().duration(duration)
                        .attr("x", _svg.scale.x.range()[0] + (pos || 0) * (_svg.scale.x.range()[1] - _svg.scale.x.range()[0]))
                        .attr("y", _svg.scale.y(value));
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
         * @memberOf du.widgets.multibarchart.MultiBarChart
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
                x: _w.utils.scale(_w.attr.xDomain ? _w.attr.xDomain : xData, [0, _w.attr.innerWidth], "band"),
                y: _w.utils.scale(data.reduce(function (a, d) {
                    return a.concat(d.values);
                }, []).map(function (d) {
                    return d.y;
                }).concat([0]), [_w.attr.innerHeight, 0])
            };

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

            // Markers
            for (var marker in _markers) {
                if (_markers.hasOwnProperty(marker)) {
                    _markers[marker].update(duration);
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
    MultiBarChart.prototype = Object.create(Widget.prototype);
    return MultiBarChart;
}));
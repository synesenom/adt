/**
 * Module implementing an interactive histogram.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module histogram
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.widgets.Widget
 */
// TODO change data structure to key-value pairs
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widgets'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'widgets', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Histogram = factory(global.d3, global.du.widgets.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The bar chart widget class.
     *
     * @class Histogram
     * @memberOf du.widgets.histogram
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Histogram(name, parent) {
        var _w = Widget.call(this, name, "histogram", "svg", parent);

        /**
         * Sets the lower boundary of the histogram.
         * Default is unset (calculated automatically from data).
         *
         * @method min
         * @methodOf du.widgets.histogram.Histogram
         * @param {number} value Value to set as lower boundary.
         */
        _w.attr.add(this, "min", null);

        /**
         * Sets the upper boundary of the histogram.
         * Default is unset (calculated automatically from data).
         *
         * @method max
         * @methodOf du.widgets.histogram.Histogram
         * @param {number} value Value to set as upper boundary.
         */
        _w.attr.add(this, "max", null);

        /**
         * Sets the bin width of the histogram.
         * Default is unset (calculated automatically from data using the Friedman-Diaconis rule).
         *
         * @method bin
         * @methodOf du.widgets.histogram.Histogram
         * @param {number} size Bin size to set.
         */
        _w.attr.add(this, "bin", null);

        /**
         * Normalizes histogram counts to 1.
         * Default is false.
         *
         * @method normalize
         * @methodOf du.widgets.histogram.Histogram
         * @param {boolean} on Whether normalization is on.
         */
        _w.attr.add(this, "normalize", false);

        // Widget elements
        var _svg = {};
        var _data = [];

        /**
         * Binds data to the histogram.
         * Data must be an array of values, binning is done by the chart itself.
         *
         * @method data
         * @memberOf du.widgets.histogram.Histogram
         * @param {Array} data Array of {x: (number|string), y: number} objects.
         * @returns {du.widgets.histogram.Histogram} Reference to the current histogram.
         */
        this.data = function(data) {
            _data = data.sort(function(a, b) {
                return +a - b;
            });
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.histogram.Histogram
         * @param {string} key Key of the line to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.histogram.Histogram} Reference to the current histogram.
         */
        this.highlight = function(key, duration) {
            _w.utils.highlight(_svg, ".bar", key, duration);
            return this;
        };

        // Builder
        _w.render.build = function() {
            // Add chart itself
            _svg.g = _w.widget.append("g");

            // Axes
            _svg.axisFn = {
                x: d3.axisBottom()
                    .ticks(4),
                y: d3.axisLeft()
                    .ticks(4)
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
            if (_data.length === 0) {
                return;
            }

            // Calculate min, max nd bins
            var realMin = typeof _w.attr.min === "number" ? _w.attr.min : _data[0];
            var realMax = typeof _w.attr.max === "number" ? _w.attr.max : _data[_data.length - 1];
            var realBin = _w.attr.bin;
            if (realBin === null) {
                var q1Id = (_data.length + 1) / 4,
                    q1a = Math.floor(q1Id),
                    q1b = Math.ceil(q1Id),
                    q1w = q1Id - q1a,
                    q1 = q1w * _data[q1a] + (1 - q1w) * _data[q1b];
                var q3Id = 3 * (_data.length + 1) / 4,
                    q3a = Math.floor(q3Id),
                    q3b = Math.ceil(q3Id),
                    q3w = q3Id - q3a,
                    q3 = q3w * _data[q3a] + (1 - q3w) * _data[q3b];
                realBin = 2 * (q3 - q1) / Math.pow(_data.length, 1 / 3);
            }

            // Compute bin thresholds
            var thresholds = [];
            var n = Math.ceil((realMax - realMin) / realBin);
            for (var i = 0; i <= n; i++) {
                thresholds.push(realMin + i * realBin);
            }
            var norm = _w.attr.normalize ? _data.length : 1;

            // Calculate bin counts
            var bins = d3.histogram()
                .domain([realMin, realMin+n*realBin])
                .thresholds(thresholds)
                (_data);

            // Calculate scale
            var yMax = d3.max(bins, function (d) {
                return d.length / norm;
            });
            var scale = _w.utils.scale({
                    x: {min: realMin, max: realMin+n*realBin, domain: [realMin, realMax]},
                    y: {
                        min: 0,
                        max: yMax,
                        domain: [0, yMax]
                    }
                },
                _w.attr.width - _w.attr.margins.left - _w.attr.margins.right,
                _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom);

            // Axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(scale.y));

            // Plot
            if (_data.length > 0) {
                // Add bars if needed
                if (_svg.bars === undefined) {
                    _svg.bars = _svg.g.selectAll(".bar")
                        .data(bins)
                        .enter().append("rect")
                        .attr("class", function (d, i) {
                            return "bar bin-" + i;
                        })
                        .style("pointer-events", "all")
                        .style("stroke", "none")
                        .style("shape-rendering", "geometricPrecision");
                    _svg.bars
                        .attr("y", _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - 1)
                        .attr("height", 0);
                }

                // Update data
                _svg.bars.data(bins);
                _svg.bars
                    .attr("x", function (d) {
                        return scale.x(d.x0) + 2;
                    })
                    .attr("width", function(d) {
                        return Math.abs(scale.x(d.x1 - d.x0) - 2);
                    })
                    .transition().duration(duration)
                    .attr("y", function (d) {
                        return _w.attr.margins.top - _w.attr.margins.top + scale.y(d.length / norm);
                    })
                    .attr("height", function (d) {
                        return _w.attr.height -_w.attr.margins.top - _w.attr.margins.bottom - scale.y(d.length / norm);
                    });
            }
        };

        // Style updater
        _w.render.style = function() {
            // Inner dimensions
            var innerWidth = _w.attr.width - _w.attr.margins.left - _w.attr.margins.right,
                innerHeight = _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom;

            // Chart
            _svg.g
                .style("width", innerWidth + "px")
                .style("height", innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.x
                .attr("transform", "translate(0," + innerHeight + ")");
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > text")
                .attr("cursor", "default")
                .style("pointer-events", "all");
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
                .attr("x", innerWidth + "px")
                .attr("y", (innerHeight + 2.6*_w.attr.fontSize) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.yLabel);

            // Plot
            if (_svg.bars !== undefined) {
                _svg.bars
                    .style("fill", _w.attr.colors);

                // Interactions
                _svg.bars
                    .on("mouseover", function (d, i) {
                        _w.attr.mouseover && _w.attr.mouseover(d, "bin-" + i);
                    })
                    .on("mouseleave", function (d, i) {
                        _w.attr.mouseleave && _w.attr.mouseleave(d, "bin-" + i);
                    })
                    .on("click", function (d, i) {
                        _w.attr.click && _w.attr.click(d, "bin-" + i);
                    });
            }
        };
    }

    // Export
    Histogram.prototype = Object.create(Widget.prototype);
    return Histogram;
}));

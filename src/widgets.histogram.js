/**
 * Module implementing an interactive histogram.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module histogram
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
        global.du.widgets.Histogram = factory(global.d3, global.du.Widget);
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
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        _w.attr.add(this, "min", null);

        /**
         * Sets the upper boundary of the histogram.
         * Default is unset (calculated automatically from data).
         *
         * @method max
         * @methodOf du.widgets.histogram.Histogram
         * @param {number} value Value to set as upper boundary.
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        _w.attr.add(this, "max", null);

        /**
         * Sets the bin width of the histogram.
         * Default is unset (calculated automatically from data using the Friedman-Diaconis rule).
         *
         * @method bin
         * @methodOf du.widgets.histogram.Histogram
         * @param {number} size Bin size to set.
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        _w.attr.add(this, "bin", null);

        /**
         * Normalizes histogram counts to 1.
         * Default is false.
         *
         * @method normalize
         * @methodOf du.widgets.histogram.Histogram
         * @param {boolean} on Whether normalization is on.
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        _w.attr.add(this, "normalize", false);

        // Widget elements
        var _svg = {};
        var _data = [];
        var _bins = [];
        var _colors = {};
        var _transition = false;

        /**
         * Binds data to the histogram.
         * Expected data format: array of single numbers.
         * Data is binned by the widget.
         *
         * @method data
         * @memberOf du.widgets.histogram.Histogram
         * @param {Array} data Data to plot.
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        this.data = function(data) {
            _data = data.sort(function(a, b) {
                return a - b;
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
         * @returns {du.widgets.histogram.Histogram} Reference to the current Histogram.
         */
        this.highlight = function(key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".bar", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {
            // Get bisection
            var bisect = d3.bisector(function (d) {
                return _svg.scale.x(d.values.x0);
            }).right;
            var i = mouse ? bisect(_bins, mouse[0]) : null;

            // If no mouse is given, just remove tooltip elements
            if (i === null) {
                return;
            }

            // Get data entry
            var left = _bins[i - 1] ? _bins[i - 1] : _bins[i];
            var right = _bins[i] ? _bins[i] : _bins[i - 1];
            var point = mouse[0] - left.x > right.x - mouse[0] ? right : left;

            // Build tooltip content
            return {
                title: point.name,
                content: {
                    type: "metrics",
                    data: [
                        {label: "min:", value: point.values.x0.toPrecision(3)},
                        {label: "max:", value: point.values.x1.toPrecision(3)},
                        {label: "count:", value: point.values.length},
                        {label: "fraction:", value: (100 * point.values.length / d3.sum(_bins, function(d) {
                            return d.values.length;
                        })).toFixed(2) + "%"}
                    ]
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
            if (_data.length === 0) {
                return;
            }

            // Calculate min, max nd bins
            var realMin = typeof _w.attr.min === "number" ? _w.attr.min : _data[0];
            var realMax = typeof _w.attr.max === "number" ? _w.attr.max : _data[_data.length - 1];
            var realBin = _w.attr.bin;
            if (realBin === null) {
                realBin = 2 * (d3.quantile(_data, 0.75) - d3.quantile(_data, 0.25)) / Math.pow(_data.length, 1 / 3);
            }

            // Compute bin thresholds
            var thresholds = [];
            var n = Math.ceil((realMax - realMin) / realBin);
            for (var i = 0; i <= n; i++) {
                thresholds.push(realMin + i * realBin);
            }
            var norm = _w.attr.normalize ? _data.length : 1;

            // Create bins
            _bins = d3.histogram()
                .domain([realMin, realMin+n*realBin])
                .thresholds(thresholds)
                (_data).map(function(d, i) {
                    return {
                        name: "bin " + i,
                        values: d
                    };
                });

            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale([realMin, realMin+n*realBin], [0, _w.attr.innerWidth]),
                y: _w.utils.scale([0, d3.max(_bins, function (d) {
                    return d.values.length / norm;
                })], [_w.attr.innerHeight, 0])
            };

            // Axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Build/update plot
            _colors = _w.utils.colors(_bins ? _bins.map(function(d){ return d.name; }) : null);
            _svg.plots.bars = _svg.g.selectAll(".bar")
                .data(_bins, function(d) {
                    return d.name;
                });
            _svg.plots.bars.exit()
                .transition().duration(duration)
                .style("height", 0)
                .remove();
            _svg.plots.bars.enter().append("rect")
                .attr("class", function (d) {
                    return "bar " + _w.utils.encode(d.name);
                })
                .attr("y", _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - 1)
                .attr("height", 0)
                .style("pointer-events", "all")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke", "none")
                .attr("x", function (d) {
                    return _svg.scale.x(d.values.x0) + 1;
                })
                .attr("width", function(d) {
                    return Math.max(0, Math.abs(_svg.scale.x(d.values.x1) - _svg.scale.x(d.values.x0)) - 2);
                })
                .style("fill", function() {
                    return _colors[_bins[0].name];
                })
            .merge(_svg.plots.bars)
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
                .attr("x", function (d) {
                    return _svg.scale.x(d.values.x0) + 1;
                })
                .attr("width", function(d) {
                    return Math.max(0, Math.abs(_svg.scale.x(d.values.x1) - _svg.scale.x(d.values.x0)) - 2);
                })
                .attr("y", function (d) {
                    return _w.attr.margins.top - _w.attr.margins.top + _svg.scale.y(d.values.length / norm);
                })
                .attr("height", function (d) {
                    return _w.attr.height -_w.attr.margins.top - _w.attr.margins.bottom - _svg.scale.y(d.values.length / norm);
                })
                .style("opacity", 1)
                .style("fill", function() {
                    return _colors[_bins[0].name];
                })
                .on("end", function() {
                    _transition = false;
                });
        };

        // Style updater
        _w.render.style = function() {
            // Chart
            _svg.g
                .style("width", _w.attr.innerWidth + "px")
                .style("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.x
                .attr("transform", "translate(0," + _w.attr.innerHeight + ")");
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
                .attr("x", _w.attr.innerWidth + "px")
                .attr("y", (_w.attr.innerHeight + 2.2*_w.attr.fontSize) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .style("fill", _w.attr.fontColor)
                .text(_w.attr.yLabel);
        };
    }

    // Export
    Histogram.prototype = Object.create(Widget.prototype);
    return Histogram;
}));

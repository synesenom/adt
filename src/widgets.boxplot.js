/**
 * Module implementing a box plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module boxplot
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
        global.du.widgets.BoxPlot = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The box plot widget class.
     *
     * @class BoxPlot
     * @memberOf du.widgets.boxplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function BoxPlot(name, parent) {
        var _w = Widget.call(this, name, "boxplot", "svg", parent);

        // Widget elements.
        var _svg = {};
        var _data = [];

        /**
         * Binds data to the box plot.
         * Expected data format: array containing objects with a {name} property with the box name and a {data}
         * property that contains the array of values for each box.
         *
         * @method data
         * @memberOf du.widgets.boxplot.BoxPlot
         * @param {object} data Data to plot.
         * @returns {du.widgets.boxplot.BoxPlot} Reference to the current BoxPlot.
         */
        this.data = function(data) {
            // Calculate box statistics
            _data = [];
            data.forEach(function(d) {
                var sd = d.data.sort(d3.ascending);
                var min = d3.min(sd),
                    max = d3.max(sd),
                    q1 = d3.quantile(sd, 0.25),
                    q3 = d3.quantile(sd, 0.75),
                    iqr = q3 - q1;
                var mildOutliers = [],
                    extremeOutliers = [];
                d.data.filter(function(x) {
                    return x < q1 - 1.5*iqr || x > q3 + 1.5*iqr;
                }).forEach(function(x) {
                    if (x < q1 - 3*iqr || x > q3 + 3*iqr) {
                        extremeOutliers.push(x);
                    } else {
                        mildOutliers.push(x);
                    }
                });
                _data.push({
                    name: d.name,
                    min: min,
                    max: max,
                    median: d3.median(sd),
                    q1: q1,
                    q3: q3,
                    lowerWhisker: Math.max(min, q1 - 1.5*iqr),
                    upperWhisker: Math.min(max, q3 + 1.5*iqr),
                    outliers: {
                        mild: mildOutliers,
                        extreme: extremeOutliers
                    }
                });
            });
            console.log(_data);
            return this;
        };

        /**
         * Highlights the specified box.
         *
         * @method highlight
         * @memberOf du.widgets.boxplot.BoxPlot
         * @param {string} key Key of the box to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.boxplot.BoxPlot} Reference to the current BoxPlot.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".box", key, duration);
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {
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
            var scale = {
                x: _w.utils.scale2(_data.map(function (d) {
                    return d.name;
                })),
                y: _w.utils.scale2(
                    _data.map(function (d) {
                        return [d.min, d.max];
                    }).reduce(function (array, d) {
                        return array.concat(d);
                    }, [])
                )
            };
        };

        // Style updater
        _w.render.style = function() {

        }
    }

    // Export
    BoxPlot.prototype = Object.create(Widget.prototype);
    return BoxPlot;
}));
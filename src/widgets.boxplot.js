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
        var _current = null;

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
                    mean: d3.mean(sd),
                    median: d3.median(sd),
                    q1: q1,
                    q3: q3,
                    whiskers: {
                        lower: Math.max(min, q1 - 1.5*iqr),
                        upper: Math.min(max, q3 + 1.5*iqr)
                    },
                    outliers: {
                        mild: mildOutliers,
                        extreme: extremeOutliers
                    }
                });
            });
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
        _w.utils.tooltip = function() {
            return _current ? {
                title: _current.name,
                stripe: _w.attr.colors[_current.name],
                content: {
                    type: "metrics",
                    data: [
                        {label: "min/max:", value: _current.min.toPrecision(3) + "/" + _current.max.toPrecision(3)},
                        {label: "mean:", value: _current.mean.toPrecision(3)},
                        {label: "median:", value: _current.median.toPrecision(3)},
                        {label: "Q1:", value: _current.q1.toPrecision(3)},
                        {label: "Q3:", value: _current.q3.toPrecision(3)},
                        {label: "#mild outliers:", value: _current.outliers.mild.length},
                        {label: "#extreme outliers:", value: _current.outliers.extreme.length}
                    ]
                }
            } : null;
        };

        // Builder
        _w.render.build = function() {
            // Add widget
            _svg.g = _w.widget.append("g");

            // Axes
            _svg.axisFn = {
                x: d3.axisBottom()
                    .ticks(5),
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
            _svg.scale = {
                x: _w.utils.scale(_data.map(function (d) {
                    return d.name;
                }).reverse(), [_w.attr.innerWidth, 0], "point"),
                y: _w.utils.scale(
                    _data.map(function (d) {
                        return [d.min-0.1*(d.max-d.min), d.max+0.1*(d.max-d.min)];
                    }).reduce(function (array, d) {
                        return array.concat(d);
                    }, []), [_w.attr.innerHeight, 0])
            };

            // Axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Update plots
            if(_data.length > 0) {
                // Add boxes
                if (_svg.boxes === undefined) {
                    _svg.boxes = {};
                    _data.forEach(function (d) {
                        var g = _svg.g.selectAll("." + _w.utils.encode(d.name))
                            .data([d])
                            .enter().append("g")
                            .attr("class", "box " + _w.utils.encode(d.name));
                        _svg.boxes[d.name] = {
                            g: g,
                            body: g.append("rect")
                                .attr("x", _svg.scale.x(d.name) - 10)
                                .attr("y", _svg.scale.y(d.q3))
                                .attr("width", 20)
                                .attr("height", _svg.scale.y(d.q1) - _svg.scale.y(d.q3))
                                .style("rx", "2px")
                                .style("ry", "2px")
                                .style("fill-opacity", 0.3)
                                .style("stroke-width", "1px"),
                            median: g.append("line")
                                .attr("class", "median")
                                .attr("x1", _svg.scale.x(d.name) - 10)
                                .attr("x2", _svg.scale.x(d.name) + 10)
                                .attr("y1", _svg.scale.y(d.median))
                                .attr("y2", _svg.scale.y(d.median))
                                .style("stroke-width", "2px")
                                .style("fill-opacity", 0.8),
                            whiskers: {
                                lower: g.append("path")
                                    .attr("d", "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.q1) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.whiskers.lower) + "M" + (_svg.scale.x(d.name)-8) + "," + _svg.scale.y(d.whiskers.lower) + "L" + (_svg.scale.x(d.name)+8) + "," + _svg.scale.y(d.whiskers.lower)),
                                upper: g.append("path")
                                    .attr("d", "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.q3) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.whiskers.upper) + "M" + (_svg.scale.x(d.name)-8) + "," + _svg.scale.y(d.whiskers.upper) + "L" + (_svg.scale.x(d.name)+8) + "," + _svg.scale.y(d.whiskers.upper))
                            },
                            outliers: {
                                mild: g.append("g")
                                    .attr("class", "mild-outlier")
                                    .selectAll(".mild-outlier")
                                    .data(d.outliers.mild)
                                    .enter().append("circle")
                                    .attr("r", 2.5)
                                    .attr("cx", _svg.scale.x(d.name))
                                    .attr("cy", function(dd) {
                                        return _svg.scale.y(dd);
                                    })
                                    .attr("stroke", "none"),
                                extreme: g.append("g")
                                    .attr("class", "extreme-outlier")
                                    .selectAll(".extreme-outlier")
                                    .data(d.outliers.extreme)
                                    .enter().append("circle")
                                    .attr("r", 2)
                                    .attr("cx", _svg.scale.x(d.name))
                                    .attr("cy", function(dd) {
                                        return _svg.scale.y(dd);
                                    })
                                    .attr("fill", "none")
                                    .attr("stroke-width", "0.5px")
                            }
                        }
                    });
                }

                // Update data
                _data.forEach(function(d) {
                    // TODO
                });
            }
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data ? _data.map(function(d) {return d.name; }) : null);

            // Chart
            _svg.g
                .style("width", _w.attr.innerWidth + "px")
                .style("height", _w.attr.innerHeight + "px")
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

            // Plot
            _.forOwn(_svg.boxes, function(box, name) {
                box.body.style("fill", _w.attr.colors[name])
                    .style("stroke", _w.attr.colors[name]);
                box.whiskers.lower.style("stroke", _w.attr.colors[name]);
                box.whiskers.upper.style("stroke", _w.attr.colors[name]);
                box.median
                    .style("fill", _w.attr.colors[name])
                    .style("stroke", _w.attr.colors[name]);
                box.outliers.mild.style("fill", _w.attr.colors[name]);
                box.outliers.extreme.style("stroke", _w.attr.colors[name]);
                box.g
                    .on("mouseover", function(d) {
                        _current = d;
                        _w.attr.mouseover && _w.attr.mouseover(name);
                    })
                    .on("mouseleave", function() {
                        _current = null;
                        _w.attr.mouseleave && _w.attr.mouseleave(name);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(name);
                    });
            });
        }
    }

    // Export
    BoxPlot.prototype = Object.create(Widget.prototype);
    return BoxPlot;
}));
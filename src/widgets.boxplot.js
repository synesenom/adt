/**
 * Module implementing a box plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module boxplot
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
        global.du.widgets.BoxPlot = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
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
        var _colors = {};
        var _transition = false;

        /**
         * Binds data to the box plot.
         * Expected data format: array containing objects with a {name} property with the box name and a {values}
         * property that contains the array of values for the box.
         *
         * @method data
         * @memberOf du.widgets.boxplot.BoxPlot
         * @param {object} data Data to plot.
         * @returns {du.widgets.boxplot.BoxPlot} Reference to the current BoxPlot.
         */
        this.data = function (data) {
            // Calculate box statistics
            _data = data.map(function (d) {
                var sd = d.values.sort(d3.ascending),
                    min = d3.min(sd),
                    max = d3.max(sd),
                    q1 = d3.quantile(sd, 0.25),
                    q3 = d3.quantile(sd, 0.75),
                    iqr = q3 - q1;
                var mildOutliers = [],
                    extremeOutliers = [];
                d.values.filter(function (x) {
                    return x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr;
                }).forEach(function (x) {
                    if (x < q1 - 3 * iqr || x > q3 + 3 * iqr) {
                        extremeOutliers.push(x);
                    } else {
                        mildOutliers.push(x);
                    }
                });
                return {
                    name: d.name,
                    values: {
                        min: min,
                        max: max,
                        mean: d3.mean(sd),
                        median: d3.median(sd),
                        q1: q1,
                        q3: q3,
                        whiskers: {
                            lower: Math.max(min, q1 - 1.5 * iqr),
                            upper: Math.min(max, q3 + 1.5 * iqr)
                        },
                        outliers: {
                            mild: mildOutliers,
                            extreme: extremeOutliers
                        }
                    }
                };
            });
            return this;
        };

        /**
         * Highlights the specified box.
         *
         * @method highlight
         * @memberOf du.widgets.boxplot.BoxPlot
         * @param {(string|string[])} key Single key or an array of keys of the box(es) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.boxplot.BoxPlot} Reference to the current BoxPlot.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".box", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function () {
            return _current ? {
                title: _current.name,
                stripe: _w.attr.colors[_current.name],
                content: {
                    type: "metrics",
                    data: [
                        {
                            label: "min/max:",
                            value: _current.values.min.toPrecision(3) + "/" + _current.values.max.toPrecision(3)
                        },
                        {label: "mean:", value: _current.values.mean.toPrecision(3)},
                        {label: "median:", value: _current.values.median.toPrecision(3)},
                        {label: "Q1:", value: _current.values.q1.toPrecision(3)},
                        {label: "Q3:", value: _current.values.q3.toPrecision(3)},
                        {label: "mild outliers:", value: _current.values.outliers.mild.length},
                        {label: "extreme outliers:", value: _current.values.outliers.extreme.length}
                    ]
                }
            } : null;
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
                }).reverse(), [_w.attr.innerWidth, 0], "point"),
                y: _w.utils.scale(
                    _data.map(function (d) {
                        return [d.values.min - 0.1 * (d.values.max - d.values.min), d.values.max + 0.1 * (d.values.max - d.values.min)];
                    }).reduce(function (array, d) {
                        return array.concat(d);
                    }, []), [_w.attr.innerHeight, 0])
            };

            // Axes
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

            // Build/update plots
            _colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);
            // Groups
            _svg.plots.groups = _svg.g.selectAll(".box-group")
                .data(_data, function (d) {
                    return d.name;
                });
            _svg.plots.groups.exit()
                .style("opacity", 0)
                .remove();
            var enter = _svg.plots.groups.enter().append("g")
                .attr("class", function (d) {
                    return "box-group " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("opacity", 0)
                .style("fill", "transparent");
            var union = enter.merge(_svg.plots.groups)
                .each(function () {
                    _transition = true;
                })
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
                });
            union.transition().duration(duration)
                .style("opacity", 1)
                .style("fill-opacity", _w.attr.opacity)
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .style("stroke", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });

            // Body
            enter.append("rect")
                .attr("class", "body")
                .attr("x", function (d) {
                    return _svg.scale.x(d.name) - 10;
                })
                .attr("y", function (d) {
                    return _svg.scale.y(d.values.q3);
                })
                .attr("width", 20)
                .attr("height", function (d) {
                    return _svg.scale.y(d.values.q1) - _svg.scale.y(d.values.q3);
                })
                .style("rx", "2px")
                .style("ry", "2px")
                .style("fill-opacity", 0.3)
                .style("stroke-width", "1px");
            union.select(".body")
                .transition().duration(duration)
                .attr("x", function (d) {
                    return _svg.scale.x(d.name) - 10;
                })
                .attr("y", function (d) {
                    return _svg.scale.y(d.values.q3);
                })
                .attr("width", 20)
                .attr("height", function (d) {
                    return _svg.scale.y(d.values.q1) - _svg.scale.y(d.values.q3);
                });

            // Median
            enter.append("line")
                .attr("class", "median")
                .attr("x1", function (d) {
                    return _svg.scale.x(d.name) - 10;
                })
                .attr("x2", function (d) {
                    return _svg.scale.x(d.name) + 10;
                })
                .attr("y1", function (d) {
                    return _svg.scale.y(d.values.median);
                })
                .attr("y2", function (d) {
                    return _svg.scale.y(d.values.median);
                })
                .style("stroke-width", "2px")
                .style("fill-opacity", 0.8);
            union.select(".median")
                .transition().duration(duration)
                .attr("x1", function (d) {
                    return _svg.scale.x(d.name) - 10;
                })
                .attr("x2", function (d) {
                    return _svg.scale.x(d.name) + 10;
                })
                .attr("y1", function (d) {
                    return _svg.scale.y(d.values.median);
                })
                .attr("y2", function (d) {
                    return _svg.scale.y(d.values.median);
                });

            // Upper whisker
            enter.append("path")
                .attr("class", "lower-whisker")
                .attr("d", function (d) {
                    return "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.q1) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.whiskers.lower) + "M" + (_svg.scale.x(d.name) - 8) + "," + _svg.scale.y(d.values.whiskers.lower) + "L" + (_svg.scale.x(d.name) + 8) + "," + _svg.scale.y(d.values.whiskers.lower);
                });
            union.select(".lower-whisker")
                .transition().duration(duration)
                .attr("d", function (d) {
                    return "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.q1) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.whiskers.lower) + "M" + (_svg.scale.x(d.name) - 8) + "," + _svg.scale.y(d.values.whiskers.lower) + "L" + (_svg.scale.x(d.name) + 8) + "," + _svg.scale.y(d.values.whiskers.lower);
                });

            // Lower whisker
            enter.append("path")
                .attr("class", "upper-whisker")
                .attr("d", function (d) {
                    return "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.q3) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.whiskers.upper) + "M" + (_svg.scale.x(d.name) - 8) + "," + _svg.scale.y(d.values.whiskers.upper) + "L" + (_svg.scale.x(d.name) + 8) + "," + _svg.scale.y(d.values.whiskers.upper);
                });
            union.select(".upper-whisker")
                .transition().duration(duration)
                .attr("d", function (d) {
                    return "M" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.q3) + "L" + _svg.scale.x(d.name) + "," + _svg.scale.y(d.values.whiskers.upper) + "M" + (_svg.scale.x(d.name) - 8) + "," + _svg.scale.y(d.values.whiskers.upper) + "L" + (_svg.scale.x(d.name) + 8) + "," + _svg.scale.y(d.values.whiskers.upper);
                });

            // Mild outliers
            union.selectAll(".mild-outlier")
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            var mildOutliers = union.selectAll(".mild-outlier")
                .data(function (d) {
                    return d.values.outliers.mild.map(function (dd) {
                        return {x: d.name, y: dd};
                    });
                });
            mildOutliers.enter().append("circle")
                .attr("class", "mild-outlier")
                .attr("r", 2.5)
                .attr("cx", function (d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.y);
                })
                .attr("stroke", "none")
                .style("opacity", 0)
                .transition().duration(duration)
                .style("opacity", 1);

            // Extreme outliers
            union.selectAll(".extreme-outlier")
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            var extremeOutliers = union.selectAll(".extreme-outlier")
                .data(function (d) {
                    return d.values.outliers.extreme.map(function (dd) {
                        return {x: d.name, y: dd};
                    });
                });
            extremeOutliers.enter().append("circle")
                .attr("class", "extreme-outlier")
                .attr("r", 2)
                .attr("cx", function (d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.y);
                })
                .attr("fill", "none")
                .attr("stroke-width", "0.5px")
                .style("opacity", 0)
                .transition().duration(duration)
                .style("opacity", 1);
        };

        // Style updater
        _w.render.style = function () {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);

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
                .attr("y", (_w.attr.innerHeight + 2.8 * _w.attr.fontSize) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);
        };
    }

    // Export
    BoxPlot.prototype = Object.create(Widget.prototype);
    return BoxPlot;
}));
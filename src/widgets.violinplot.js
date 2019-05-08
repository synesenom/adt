/**
 * Module implementing a violin plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module violinplot
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
        global.du.widgets.ViolinPlot = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The violin plot widget class.
     *
     * @class ViolinPlot
     * @memberOf du.widgets.violinplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function ViolinPlot(name, parent) {
        var _w = Widget.call(this, name, "violinplot", "svg", parent);

        /**
         * Calculates the KDE for an array of values.
         *
         * @method _kde
         * @methodOf du.widgets.violinplot.ViolinPlot
         * @param {function} kernel Kernel function to use.
         * @param {Array} dist Array of values to apply KDE on.
         * @returns {Function} The calculated KDE.
         * @private
         */
        function _kde(kernel, dist) {
            return function (sample) {
                return dist.map(function (x) {
                    return {
                        x: x,
                        y: d3.mean(sample, function (v) {
                            return kernel(x - v);
                        })
                    };
                });
            };
        }

        /**
         * Epanechnikov kernel function.
         *
         * @method epanechnikovKernel
         * @methodOf du.widgets.violinplot.ViolinPlot
         * @param {number} scale Scale parameter of the kernel.
         * @returns {Function} The kernel function.
         * @private
         */
        function _epanechnikovKernel(scale) {
            return function (u) {
                return Math.abs(u /= scale) <= 1 ?
                    .75 * (1 - u * u) / scale : 0;
            };
        }

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _current = null;
        var _yMin = 0;
        var _yMax = 1;
        var _colors = {};
        var _transition = false;

        /**
         * Binds data to the violin plot.
         * Expected data format: array containing the violin objects. Each violin needs to have a {name} property
         * denoting its name and a {data} property that contains the array of corresponding values. The violins are
         * calculated automatically.
         *
         * @method data
         * @memberOf du.widgets.violinplot.ViolinPlot
         * @param {object} data Data to plot.
         * @returns {du.widgets.violinplot.ViolinPlot} Reference to the current ViolinPlot.
         */
        this.data = function (data) {
            var fullData = data.reduce(function (a, d) {
                return a.concat(d.values);
            }, []);
            _yMin = d3.min(fullData);
            _yMax = d3.max(fullData);
            _data = data.map(function (d) {
                var sd = d.values.sort(d3.ascending),
                    min = d3.min(sd),
                    max = d3.max(sd),
                    q1 = d3.quantile(sd, 0.25),
                    q3 = d3.quantile(sd, 0.75),
                    delta = 0.2 * (max - min);
                var kde = _kde(_epanechnikovKernel(0.05 * (max - min)),
                    d3.range(21).map(function (d) {
                        return (max - min + 2 * delta) * d / 20 + (min - delta);
                    }));
                var violinData = kde(d.values);
                return {
                    name: d.name,
                    scale: {
                        x: d3.scaleLinear()
                            .domain([_yMin, _yMax])
                            .range([_w.attr.innerHeight, 0]),
                        y: d3.scaleLinear()
                            .range([10, 0])
                            .domain([0, d3.max(violinData, function (dd) {
                                return dd.y;
                            })])
                    },
                    values: {
                        min: min,
                        max: max,
                        mean: d3.mean(sd),
                        median: d3.median(sd),
                        q1: q1,
                        q3: q3,
                        data: violinData
                    }
                };
            });
            return this;
        };

        /**
         * Highlights the specified violin.
         *
         * @method highlight
         * @memberOf du.widgets.violinplot.ViolinPlot
         * @param {(string|string[])} key Single key or an array of keys of the violin(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.violinplot.ViolinPlot} Reference to the current ViolinPlot.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".violin", key, duration);
            return this;
        };

        // Tooltip builder
        _w.utils.tooltip = function () {
            return _current ? {
                title: _current.name,
                stripe: _colors[_current.name],
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
                        {label: "Q3:", value: _current.values.q3.toPrecision(3)}
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
                .attr("transform", function (d) {
                    return "translate(" + _svg.scale.x(d.name) + ",0)";
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
                .attr("transform", function (d) {
                    return "translate(" + _svg.scale.x(d.name) + ",0)";
                })
                .style("opacity", 1)
                .style("fill-opacity", 0.3)
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .style("stroke", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });

            // Violin itself
            enter.append("path")
                .attr("transform", "rotate(90) translate(0,-" + (10 + 0.5) + ")");
            union.select("path")
                .transition().duration(duration)
                .attr("d", function (d) {
                    d.scale.x.range([_w.attr.innerHeight, 0]);
                    var area = d3.area()
                        .curve(d3.curveBasis)
                        .x(function (dd) {
                            return d.scale.x(Math.min(_yMax, Math.max(_yMin, dd.x)));
                        })
                        .y0(function (dd) {
                            return d.scale.y(-dd.y);
                        })
                        .y1(function (dd) {
                            return d.scale.y(dd.y);
                        });
                    return area(d.values.data);
                })
                .attr("transform", "rotate(90) translate(0,-" + (10 + 0.5) + ")");
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
            _svg.axes.x
                .attr("transform", "translate(0," + _w.attr.innerHeight + ")");
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");

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
    ViolinPlot.prototype = Object.create(Widget.prototype);
    return ViolinPlot;
}));
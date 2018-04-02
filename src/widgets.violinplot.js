/**
 * Module implementing a violin plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module violinplot
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
        global.du.widgets.ViolinPlot = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
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
         * @returns {Function} The kernel function
         */
        function epanechnikovKernel(scale) {
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

        /**
         * Binds data to the violin plot.
         * Expected data format: array containing objects with a {name} property with the box name and a {data}
         * property that contains the array of values for each violin.
         *
         * @method data
         * @memberOf du.widgets.violinplot.ViolinPlot
         * @param {object} data Data to plot.
         * @returns {du.widgets.violinplot.ViolinPlot} Reference to the current ViolinPlot.
         */
        // TODO add mode
        this.data = function(data) {
            var fullData = data.reduce(function(a, d) {
                return a.concat(d.data);
            }, []);
            _yMin = d3.min(fullData);
            _yMax = d3.max(fullData);
            _data = data.map(function(d) {
                var sd = d.data.sort(d3.ascending),
                    min = d3.min(sd),
                    max = d3.max(sd),
                    q1 = d3.quantile(sd, 0.25),
                    q3 = d3.quantile(sd, 0.75),
                    delta = 0.2 * (max - min);
                var kde = _kde(epanechnikovKernel(0.05 * (max - min)),
                    d3.scaleLinear().domain([min - delta, max + delta]).ticks(20));
                var violinData = kde(d.data);
                return {
                    name: d.name,
                    min: min,
                    max: max,
                    mean: d3.mean(sd),
                    median: d3.median(sd),
                    q1: q1,
                    q3: q3,
                    data: violinData,
                    scale: {
                        x: d3.scaleLinear()
                            .domain([_yMin, _yMax])
                            .range([_w.attr.innerHeight, 0]),
                        y: d3.scaleLinear()
                            .range([10, 0])
                            .domain([0, d3.max(violinData, function (dd) {
                                return dd.y;
                            })])
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
         * @param {string} key Key of the violin to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.violinplot.ViolinPlot} Reference to the current ViolinPlot.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".violin", key, duration);
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
                        {label: "Q3:", value: _current.q3.toPrecision(3)}
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
                // Add violins
                if (_svg.violins === undefined) {
                    _svg.violins = {};
                    _data.forEach(function (d) {
                        d.scale.x.range([_w.attr.innerHeight, 0]);
                        var g = _svg.g.append("g")
                            .attr("class", "violin " + _w.utils.encode(d.name))
                            .attr("transform", "translate(" + _svg.scale.x(d.name) + ",0)");
                        var area = d3.area()
                            .curve(d3.curveBasis)
                            .x(function (dd) {
                                return d.scale.x(Math.min(_yMax, Math.max(_yMin, dd.x)));
                            })
                            .y0(10)
                            .y1(function (dd) {
                                return d.scale.y(dd.y);
                            });
                        var line = d3.line()
                            .curve(d3.curveBasis)
                            .x(function (dd) {
                                return d.scale.x(Math.min(_yMax, Math.max(_yMin, dd.x)));
                            })
                            .y(function (dd) {
                                return d.scale.y(dd.y);
                            });
                        _svg.violins[d.name] = {
                            g: g,
                            area: {
                                fn: area,
                                left: g.append("path")
                                    .attr("class", "leftarea")
                                    .attr("d", area(d.data))
                                    .attr("transform", "rotate(90) translate(0," + (10 - 0.5) + ") scale(1,-1)")
                                    .style("fill-opacity", 0.3)
                                    .style("stroke", "none"),
                                right: g.append("path")
                                    .attr("class", "rightarea")
                                    .attr("d", line(d.data))
                                    .attr("transform", "rotate(90) translate(0,-" + (10 + 0.5) + ")")
                                    .style("fill-opacity", 0.3)
                                    .style("stroke", "none")
                            },
                            line: {
                                fn: line,
                                left: g.append("path")
                                    .attr("cladd", "leftline")
                                    .attr("d", line(d.data))
                                    .attr("transform", "rotate(90) translate(0," + (10 - 0.5) + ") scale(1,-1)")
                                    .style("fill", "none")
                                    .style("stroke-width", "1px"),
                                right: g.append("path")
                                    .attr("cladd", "rightline")
                                    .attr("d", line(d.data))
                                    .attr("transform", "rotate(90) translate(0,-" + (10 + 0.5) + ")")
                                    .style("fill", "none")
                                    .style("stroke-width", "1px")
                            }
                        };
                    });
                }

                // Update data
                _data.forEach(function(d) {
                    // Area
                    _svg.violins[d.name].area.fn
                        .x(function (dd) {
                            return d.scale.x(Math.min(_yMax, Math.max(_yMin, dd.x)));
                        })
                        .y1(function (dd) {
                            return d.scale.y(dd.y);
                        });
                    _svg.violins[d.name].area.left
                        .transition().duration(duration)
                        .attr("d", _svg.violins[d.name].area.fn(d.data));
                    _svg.violins[d.name].area.right
                        .transition().duration(duration)
                        .attr("d", _svg.violins[d.name].area.fn(d.data));

                    // Line
                    _svg.violins[d.name].line.fn
                        .x(function (dd) {
                            return d.scale.x(Math.min(_yMax, Math.max(_yMin, dd.x)));
                        })
                        .y(function (dd) {
                            return d.scale.y(dd.y);
                        });
                    _svg.violins[d.name].line.left
                        .transition().duration(duration)
                        .attr("d", _svg.violins[d.name].line.fn(d.data));
                    _svg.violins[d.name].line.right
                        .transition().duration(duration)
                        .attr("d", _svg.violins[d.name].line.fn(d.data));
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
            _.forOwn(_svg.violins, function(violin, name) {
                violin.line.left.style("stroke", _w.attr.colors[name]);
                violin.line.right.style("stroke", _w.attr.colors[name]);
                violin.area.left.style("fill", _w.attr.colors[name]);
                violin.area.right.style("fill", _w.attr.colors[name]);
                violin.g
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
        };
    }

    // Export
    ViolinPlot.prototype = Object.create(Widget.prototype);
    return ViolinPlot;
}));
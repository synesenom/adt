/**
 * Module implementing a scatter plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module scatterplot
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
        global.du.widgets.ScatterPlot = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The scatter plot widget class.
     *
     * @class ScatterPlot
     * @memberOf du.widgets.scatterplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function ScatterPlot(name, parent) {
        var _w = Widget.call(this, name, "scatterplot", "svg", parent);

        /**
         * Sets the opacity of the area plots.
         * Default is 0.3.
         *
         * @method opacity
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {number} value The opacity value to set.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        _w.attr.add(this, "opacity", 0.4);

        /**
         * Sets the stroke color of the circles.
         * Default is white.
         *
         * @method stroke
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {string} color Color to set stroke to.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        _w.attr.add(this, "stroke", "white");

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _diagram = null;

        /**
         * Binds data to the scatter plot.
         * Expected data format: array of objects with properties {x} and {y}, where both {x} and {y} are objects
         * containing the coordinates for each quantity to plot.
         *
         * @method data
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {Array} data Data to plot.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.data = function(data) {
            _data = data;
            return this;
        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {string} key Key of the scatter to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".dot", key, duration);
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {
            if (!mouse) {
                this.tt && this.tt.remove();
                this.tt = null;
                return null;
            }

            // Find closest sites
            var site = _diagram.find(mouse[0], mouse[1], 10);
            if (!site) {
                this.tt && this.tt.remove();
                this.tt = null;
                return;
            }

            // Marker
            this.tt = this.tt || _svg.g.append("circle");
            this.tt.attr("r", 6)
                .attr("cx", site.data[0])
                .attr("cy", site.data[1])
                .style("pointer-events", "none")
                .style("stroke", _w.attr.stroke)
                .style("fill", _w.attr.colors[site.data.name]);

            // Tooltip
            return {
                title: site.data.name,
                content: {
                    type: "metrics",
                    data: [
                        {label: _w.attr.xLabel + ":", value: site.data[0].toPrecision(4)},
                        {label: _w.attr.yLabel + ":", value: site.data[1].toPrecision(4)}
                    ]
                }
            };
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
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data.map(function (d) {
                    return d3.values(d.x);
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.map(function (d) {
                    return d3.values(d.y);
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [_w.attr.innerHeight, 0])
            };

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Update plots
            if (_data.length > 0) {
                // Add areas if needed
                if (_svg.dots === undefined) {
                    _svg.dots = {};
                    _.forOwn(_data[0].x, function (xk, k) {
                        _svg.dots[k] = _svg.g.selectAll(".dot." + _w.utils.encode(k))
                            .data(_data.map(function(d) {
                                return {x: d.x[k], y: d.y[k]};
                            }))
                            .enter().append("circle")
                            .attr("class", "dot " + _w.utils.encode(k))
                            .attr("r", 3)
                            .attr("cx", function(d) {
                                return _svg.scale.x(d.x);
                            })
                            .attr("cy", function(d) {
                                return _svg.scale.y(d.y);
                            })
                            .style("stroke-width", "0.5px")
                            .style("shape-rendering", "geometricPrecision");
                    });
                }

                // Update data
                _.forOwn(_data[0].x, function (xk, k) {
                    _svg.dots[k]
                        .transition().duration(duration)
                        .attr("cx", function(d) {
                            return _svg.scale.x(d.x);
                        })
                        .attr("cy", function(d) {
                            return _svg.scale.y(d.y);
                        });
                });

                // Voronoi tessellation
                var voronoi = d3.voronoi()
                    .extent([[-1, -1], [_w.attr.width + 1, _w.attr.height + 1]]);
                var sites = [];
                _data.forEach(function(d) {
                    _.forOwn(d.x, function(xk, k) {
                        var site = [_svg.scale.x(xk), _svg.scale.y(d.y[k])];
                        site.name = k;
                        sites.push(site);
                    });
                });
                _diagram = voronoi(sites);
            }
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data[0] ? d3.keys(_data[0].y) : null);

            // Inner dimensions
            var innerWidth = _w.attr.width - _w.attr.margins.left - _w.attr.margins.right,
                innerHeight = _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom;

            // Chart (using conventional margins)
            _svg.g
                .attr("width", innerWidth + "px")
                .attr("height", innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axes.x
                .attr("transform", "translate(0," + innerHeight + ")");
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > line")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width", "1px");

            // Labels
            _svg.labels.x
                .attr("x", innerWidth + "px")
                .attr("y", (innerHeight + 2.2*_w.attr.fontSize) + "px")
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
            _.forOwn(_svg.dots, function(dk, k) {
                _svg.dots[k]
                    .style("fill-opacity", _w.attr.opacity)
                    .style("fill", _w.attr.colors[k])
                    .style("stroke", _w.attr.stroke)
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(k);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(k);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(k);
                    });
            });
        };
    }

    // Export
    ScatterPlot.prototype = Object.create(Widget.prototype);
    return ScatterPlot;
}));
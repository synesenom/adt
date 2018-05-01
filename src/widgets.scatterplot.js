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
// TODO add ticks on axis
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

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _colors = {};
        var _diagram = null;
        var _transition = false;

        /**
         * Binds data to the scatter plot.
         * Expected data format: array of objects with property names for each plot and values as object having an {x}
         * and {y} coordinates.
         *
         * @method data
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {Array} data Data to plot.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.data = function(data) {
            _data = d3.keys(data[0]).map(function(name) {
                return {
                    name: name,
                    values: data.map(function(d) {
                        return {
                            x: d[name].x,
                            y: d[name].y
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
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {string} key Key of the scatter to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.highlight = function(key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".dot-group", key, duration);
            return this;
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
                .style("fill", _colors[site.data.name]);

            // Tooltip
            return {
                title: site.data.name,
                stripe: _colors[site.data.name],
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

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x.scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y.scale(_svg.scale.y));

            // Build/update plots
            _colors = _w.utils.colors(_data ? _data.map(function(d){ return d.name; }) : null);
            // Groups
            _svg.plots.groups = _svg.g.selectAll(".dot-group")
                .data(_data, function(d) {
                    return d.name;
                });
            _svg.plots.groups.exit()
                .transition().duration(duration)
                .remove();
            var groups = _svg.plots.groups.enter().append("g")
                .attr("class", function (d) {
                    return "dot-group " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("stroke", "none")
                .style("fill", "transparent");
            _svg.plots.groups = groups.merge(_svg.plots.groups)
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
                });
            _svg.plots.groups
                .transition().duration(duration)
                .style("fill-opacity", _w.attr.opacity)
                .style("fill", function(d) {
                    return _colors[d.name];
                })
                .on("end", function() {
                    _transition = false;
                });

            // Dots
            _svg.plots.dots = _svg.plots.groups.selectAll(".dot")
                .data(function(d) {
                    return d.values;
                });
            _svg.plots.dots.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.dots.enter().append("circle")
                .attr("class", "dot")
                .style("opacity", 0)
                .attr("cx", function(d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function(d) {
                    return _svg.scale.y(d.y);
                })
            .merge(_svg.plots.dots)
                .transition().duration(duration)
                .style("opacity", 1)
                .attr("r", 3)
                .attr("cx", function(d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function(d) {
                    return _svg.scale.y(d.y);
                });

            // Update Voronoi tessellation
            var sites = [];
            _data.forEach(function(d) {
                d.values.forEach(function(dd) {
                    var site = [_svg.scale.x(dd.x), _svg.scale.y(dd.y)];
                    site.name = d.name;
                    sites.push(site);
                });
            });
            var voronoi = d3.voronoi()
                .extent([[-1, -1], [_w.attr.width + 1, _w.attr.height + 1]]);
            _diagram = voronoi(sites);
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data[0] ? d3.keys(_data[0].y) : null);

            // Chart (using conventional margins)
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
        };
    }

    // Export
    ScatterPlot.prototype = Object.create(Widget.prototype);
    return ScatterPlot;
}));
/**
 * Module implementing a bubble chart.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module bubblechart
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
        global.du.widgets.BubbleChart = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The bubble chart widget class.
     *
     * @class BubbleChart
     * @memberOf du.widgets.bubblechart
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function BubbleChart(name, parent) {
        var _w = Widget.call(this, name, "bubblechart", "svg", parent);

        /**
         * Sets the scale of the bubbles' radius.
         * Default is 1.
         *
         * @method scale
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {number} factor Scaling factor of the bubbles.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        _w.attr.add(this, "scale", 1);

        /**
         * Sets the label for the bubble sizes.
         * Default is 'size'.
         *
         * @method sizeLabel
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {string} label Label to set to bubble size.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        _w.attr.add(this, "sizeLabel", "size");

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _current = null;

        /**
         * Binds data to the bubble chart.
         * Expected data format: array of object with properties {name}, {x}, {y} and {size}.
         *
         * @method data
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {Array} data Data to plot.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        this.data = function(data) {
            _data = data;
            return this;
        };

        /**
         * Highlights the specified bubble.
         *
         * @method highlight
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {string} key Name of the bubble to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".bubble", key, duration);
        };

        // Tooltip builder
        _w.utils.tooltip = function() {
            return _current ? {
                title: _current.name,
                stripe: _w.attr.colors[_current.name],
                content: {
                    type: "metrics",
                    data: [
                        {label: _w.attr.xLabel + ":", value: _current.x.toPrecision(4)},
                        {label: _w.attr.yLabel + ":", value: _current.y.toPrecision(4)},
                        {label: _w.attr.sizeLabel + ":", value: _current.size.toFixed(1)}
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
                    return [d.x-1.1*_w.attr.scale*d.size, d.x+1.1*_w.attr.scale*d.size];
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.map(function (d) {
                    return [d.y-1.1*_w.attr.scale*d.size, d.y+1.1*_w.attr.scale*d.size];
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
                if (_svg.bubbles === undefined) {
                    _svg.bubbles = _svg.g.selectAll(".bubble")
                        .data(_data)
                        .enter().append("circle")
                        .attr("class", function(d) {
                            return "bubble " + _w.utils.encode(d.name);
                        })
                        .attr("r", function(d) {
                            return _w.attr.scale * d.size;
                        })
                        .attr("cx", function(d) {
                            return _svg.scale.x(d.x);
                        })
                        .attr("cy", function(d) {
                            return _svg.scale.y(d.y);
                        })
                        .style("stroke", "none")
                        .style("shape-rendering", "geometricPrecision");
                }

                // Update data
                _svg.bubbles
                    .data(_data)
                    .transition().duration(duration)
                    .attr("r", function(d) {
                        return _w.attr.scale * d.size;
                    })
                    .attr("cx", function(d) {
                        return _svg.scale.x(d.x);
                    })
                    .attr("cy", function(d) {
                        return _svg.scale.y(d.y);
                    });
            }
        };

        // Style updater
        _w.render.style = function() {
            // Set colors
            _w.attr.colors = _w.utils.colors(_data ? _data.map(function(d) {
                return d.name;
            }) : null);

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

            // Plot
            _svg.bubbles
                .style("fill", function(d) {
                    return _w.attr.colors[d.name];
                })
                .style("stroke", _w.attr.stroke)
                .on("mouseover", function(d) {
                    _current = d;
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function(d) {
                    _current = null;
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function(d) {
                    _w.attr.click && _w.attr.click(d.name);
                });
        };
    }

    // Export
    BubbleChart.prototype = Object.create(Widget.prototype);
    return BubbleChart;
}));
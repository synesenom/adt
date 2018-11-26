/**
 * Module implementing a bubble chart.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module bubblechart
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
        global.du.widgets.BubbleChart = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
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
        var _colors = {};
        var _current = null;
        var _transition = false;

        /**
         * Binds data to the bubble chart.
         * Expected data format: array of object with properties {name} (name of the bubble), {x}, {y} (bubble
         * coordinates) and {size} (relative size of the bubble).
         *
         * @method data
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {Array} data Data to plot.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        this.data = function (data) {
            _data = data.map(function (d) {
                return {
                    name: d.name,
                    values: {
                        x: d.x,
                        y: d.y,
                        size: d.size
                    }
                };
            });
            return this;
        };

        /**
         * Highlights the specified bubble.
         *
         * @method highlight
         * @memberOf du.widgets.bubblechart.BubbleChart
         * @param {(string|string[])} key Single key or an array of keys of the bubble(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.bubblechart.BubbleChart} Reference to the current BubbleChart.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".bubble", key, duration);
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
                        {label: _w.attr.xLabel + ":", value: _w.attr.tooltipXFormat(_current.values.x)},
                        {label: _w.attr.yLabel + ":", value: _w.attr.tooltipYFormat(_current.values.y)},
                        {label: _w.attr.sizeLabel + ":", value: _current.values.size.toFixed(1)}
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
                    return [d.values.x - 1.1 * _w.attr.scale * d.values.size, d.values.x + 1.1 * _w.attr.scale * d.values.size];
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.map(function (d) {
                    return [d.values.y - 1.1 * _w.attr.scale * d.values.size, d.values.y + 1.1 * _w.attr.scale * d.values.size];
                }).reduce(function (a, d) {
                    return a.concat(d);
                }, []), [_w.attr.innerHeight, 0])
            };

            // Update axes
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
            _svg.plots.bubbles = _svg.g.selectAll(".bubble")
                .data(_data, function (d) {
                    return d.name;
                });
            _svg.plots.bubbles.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.bubbles.enter().append("circle")
                .attr("class", function (d) {
                    return "bubble " + _w.utils.encode(d.name);
                })
                .attr("cx", function (d) {
                    return _svg.scale.x(d.values.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.values.y);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("stroke", "none")
                .style("fill", "transparent")
                .merge(_svg.plots.bubbles)
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
                })
                .transition().duration(duration)
                .attr("r", function (d) {
                    return _w.attr.scale * d.values.size;
                })
                .attr("cx", function (d) {
                    return _svg.scale.x(d.values.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.values.y);
                })
                .style("opacity", 1)
                .style("fill", function (d) {
                    return _colors[d.name];
                })
                .on("end", function () {
                    _transition = false;
                });
        };

        // Style updater
        _w.render.style = function () {
            // Chart (using conventional margins)
            _svg.g
                .attr("width", _w.attr.innerWidth + "px")
                .attr("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axisFn.x.tickFormat(_w.attr.xTickFormat);
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
                .attr("y", (_w.attr.innerHeight + 2.2 * _w.attr.fontSize) + "px")
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
    BubbleChart.prototype = Object.create(Widget.prototype);
    return BubbleChart;
}));
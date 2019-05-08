/**
 * Module implementing a contour plot. A contour plot can show slow changes of a variable in two dimensions when
 * displaying the raw data would result in over plotting.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module contourplot
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'd3-contour', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.ContourPlot = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The contour plot widget class.
     *
     * @class ContourPlot
     * @memberOf du.widgets.contourplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function ContourPlot(name, parent) {
        var _w = Widget.call(this, name, "contourplot", "svg", parent);

        /**
         * Sets the number of contour layers which are distributed uniformly over the scale of the data.
         * Default is 20.
         *
         * @method layers
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {number} count Number of layers to use.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        _w.attr.add(this, 'layers', 20);

        /**
         * Sets the grid size to compute contours on. Default is [40, 40].
         *
         * @method grid
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {number[]} size Array of numbers containing the horizontal and vertical size of the grid..
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        _w.attr.add(this, 'grid', [40, 40]);

        /**
         * Adds borders to the contours. Default is false.
         *
         * @method borders
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {boolean} on Whether to add borders.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        _w.attr.add(this, 'borders', false);

        /**
         * Sets the min, mid and max colors of the contour plot. Must be an array with three colors. The color of
         * intermediate contours is interpolated with HSL interpolation.
         * Default color set is [transparent, grey, black].
         *
         * @method colors
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {string[]} colors Start and end colors of the gauge.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         * @override {du.widgets.Widget.colors}
         */

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _colors = null;
        var _current = null;
        var _transition = false;

        /**
         * Binds data to the contour plot.
         * Expected data format: array of objects containing the {x}, {y} coordinates of the data points and a {value}
         * denoting the weight of the data point. If {value} is missing, it is assumed to be 1.
         *
         * @method data
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {Array} data Data to plot.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        this.data = function (data) {
            // Initialize data
            _data = {
                xDomain: d3.extent(data, function(d) { return d.x; }),
                yDomain: d3.extent(data, function(d) { return d.y; }),
                values: new Array(_w.attr.grid[0] * _w.attr.grid[1]).fill(0)
            };

            // Accumulate
            var sx = (_data.xDomain[1] - _data.xDomain[0]) / _w.attr.grid[0],
                sy = (_data.yDomain[1] - _data.yDomain[0]) / _w.attr.grid[1];
            data.forEach(function(d) {
                var i = Math.floor((d.x - _data.xDomain[0]) / sx),
                    j = Math.floor((d.y - _data.yDomain[0]) / sy);
                _data.values[i + j * _w.attr.grid[0]] += d.value || 1;
            });

            return this;
        };

        /**
         * Highlights the specified contour.
         *
         * @method highlight
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {(string|string[])} key Single key or an array of keys of the contour(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".contour", key, duration);
            return this;
        };

        _w.utils.tooltip = function (mouse) {
            if (_current === null || !mouse) {
                return null;
            }

            // Find cell
            var x = _svg.scale.x.invert(mouse[0]),
                y = _svg.scale.y.invert(mouse[1]);
            var sx = (_data.xDomain[1] - _data.xDomain[0]) / _w.attr.grid[0],
                sy = (_data.yDomain[1] - _data.yDomain[0]) / _w.attr.grid[1];
            var i = Math.floor((x - _data.xDomain[0]) / sx),
                j = _w.attr.grid[1] - Math.floor((y - _data.yDomain[0]) / sy);
            var value = _data.values[i + _w.attr.grid[0] * j];

            if (typeof value === 'undefined') {
                return null;
            }

            // Tooltip
            return {
                title: _w.attr.tooltipTitleFormat(value),
                stripe: _colors(_current.value),
                content: {
                    type: 'metrics',
                    data: [
                        {label: _w.attr.xLabel + ":", value: _w.attr.tooltipXFormat(x)},
                        {label: _w.attr.yLabel + ":", value: _w.attr.tooltipYFormat(y)}
                    ]
                }
            };
        };

        // TODO Fix transition for multipolygons
        function pathTween(d1, index, precision) {
            return function() {
                var path0 = d3.select('.contour-' + index).node(),
                    path1 = path0.cloneNode(),
                    n0 = path0.getTotalLength(),
                    n1 = (path1.setAttribute('d', d1), path1).getTotalLength();

                var distances = [0],
                    i = 0,
                    dt = precision / Math.max(n0, n1);
                while ((i += dt) < 1) {
                    distances.push(i);
                }

                var points = distances.map(function(t) {
                    var p0 = path0.getPointAtLength(t * n0),
                        p1 = path1.getPointAtLength(t * n1);
                    return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
                });

                return function(t) {
                    return t < 1 ? 'M' + points.map(function(p) {
                        return p(t);
                    }).join('L') : d1;
                };
            };
        }

        // Builder
        _w.render.build = function () {
            _svg = _w.utils.standardAxis();
            _svg.plots = {};
        };

        // Data updater
        _w.render.update = function (duration) {
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data.xDomain, [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data.yDomain, [_w.attr.innerHeight, 0])
            };

            // Color interpolation
            var i0 = d3.interpolateHsl(
                _w.attr.colors ? _w.attr.colors[0] : 'transparent',
                _w.attr.colors ? _w.attr.colors[1] : 'grey'
            ),
                i1 = d3.interpolateHsl(
                    _w.attr.colors ? _w.attr.colors[1] : 'grey',
                    _w.attr.colors ? _w.attr.colors[2] : 'black'
            ),
                interpolateTerrain = function(t) { return t < 0.5 ? i0(t * 2) : i1((t - 0.5) * 2); };
            _colors = d3.scaleSequential(interpolateTerrain).domain(d3.extent(_data.values));

            // Calculate contour
            var contours = d3.contours()
                .size([_w.attr.grid[0], _w.attr.grid[1]])
                .thresholds(_w.attr.layers)(_data.values);

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
            _svg.plots.contours = _svg.g.selectAll(".contour")
                .data(contours, function(d, i) {
                    return i;
                });
            _svg.plots.contours.exit()
                .remove();
            _svg.plots.contours.enter().append('path')
                .attr('class', function(d, i) {
                    return 'contour contour-' + i;
                })
                .attr('d', d3.geoPath())
                .attr("transform",
                    "translate(1, 0) scale(" + _w.attr.innerWidth / _w.attr.grid[0] + "," + _w.attr.innerHeight / _w.attr.grid[1] + ")")
                .attr('fill', function(d) {
                    return _colors(d.value);
                })
                .attr('stroke', _w.attr.borders ? '#fff' : 'none')
                .attr('stroke-width', function(d, i) {
                    return _w.attr.borders && i !== 0 ? '0.1px' : '0px';
                })
                .style("opacity", 0)
                .merge(_svg.plots.contours)
                .each(function () {
                    _transition = true;
                })
                .on("mouseover", function (d, i) {
                    _current = d;
                    _w.attr.mouseover && _w.attr.mouseover('contour-' + i);
                })
                .on("mouseleave", function (d, i) {
                    _current = null;
                    _w.attr.mouseleave && _w.attr.mouseleave('contour-' + i);
                })
                .on("click", function (d, i) {
                    _w.attr.click && _w.attr.click('contour-' + i);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                /*.attrTween('d', function(d, i) {
                    return pathTween(d3.geoPath()(d), i, 1)();
                })*/
                .attr('d', d3.geoPath())
                .style("fill", function (d) {
                    return _colors(d.value);
                })
                .on("end", function () {
                    _transition = false;
                });
        };

        // Style updater
        _w.render.style = function () {
            // Chart
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
        }
    }

    // Export
    ContourPlot.prototype = Object.create(Widget.prototype);
    return ContourPlot;
}));
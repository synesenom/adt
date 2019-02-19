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
         * Sets the opacity of the contour plot.
         * Default is 0.5.
         *
         * @method opacity
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {number} value The opacity value to set.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        _w.attr.add(this, "opacity", 0.5);

        /**
         * Sets the number of contour layers which are distributed uniformly over the scale of the data.
         *
         * @method layers
         * @memberOf du.widgets.contourplot.ContourPlot
         * @param {number} count Number of layers to use.
         * @returns {du.widgets.contourplot.ContourPlot} Reference to the current ContourPlot.
         */
        _w.attr.add(this, 'layers', 20);

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
        var _nx = 50,
            _ny = 25;

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
                values: new Array(_nx * _ny).fill(0)
            };

            // Accumulate
            var sx = (_data.xDomain[1] - _data.xDomain[0]) / _nx,
                sy = (_data.yDomain[1] - _data.yDomain[0]) / _ny;
            data.forEach(function(d) {
                var i = Math.floor((d.x - _data.xDomain[0]) / sx),
                    j = Math.floor((d.y - _data.yDomain[0]) / sy);
                _data.values[i + j * _nx] += d.value || 1;
            });

            return this;
        };

        _w.utils.tooltip = function (mouse) {
            if (_current === null || !mouse) {
                return null;
            }

            // Find cell
            var x = _svg.scale.x.invert(mouse[0]),
                y = _svg.scale.y.invert(mouse[1]);
            var sx = (_data.xDomain[1] - _data.xDomain[0]) / _nx,
                sy = (_data.yDomain[1] - _data.yDomain[0]) / _ny;
            var i = Math.floor((x - _data.xDomain[0]) / sx),
                j = _ny - Math.floor((y - _data.yDomain[0]) / sy);
            var value = _data.values[i + _nx * j];

            if (typeof value === 'undefined') {
                return null;
            }

            // Tooltip
            return {
                title: 'Value: ' + value.toPrecision(3),
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

        // TODO Smooth transition
        function pathTween(d1, precision) {
            return function() {
                var path0 = this,
                    path1 = path0.cloneNode(),
                    n0 = path0.getTotalLength(),
                    n1 = (path1.setAttribute('d', d1), path1).getTotalLength();

                var distances = [0],
                    i = 0,
                    dt = precision / Math.max(n0, n1);
                while ((i += dt) < i) {
                    distances.push(i);
                }
                distances.push(1);

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
                .size([_nx, _ny])
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
                .data(contours);
            _svg.plots.contours.exit()
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.contours.enter().append('path')
                .attr('class', 'contour')
                .attr('d', d3.geoPath())
                .attr("transform", "translate(1, 0) scale(" + _w.attr.innerWidth / _nx + "," + _w.attr.innerHeight / _ny + ")")
                .attr('fill', function(d) {
                    return _colors(d.value);
                })
                .style('stroke', 'none')
                .style("opacity", 0)
                .merge(_svg.plots.contours)
                .each(function () {
                    _transition = true;
                })
                // TODO Add mouse events
                .on("mouseover", function (d) {
                    _current = d;
                    //_w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function (d) {
                    _current = null;
                    //_w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .transition().duration(duration)
                .style("opacity", 1)
                //.attrTween('d', pathTween(DUMMY_D, 4))
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

            // Plots

        }
    }

    // Export
    ContourPlot.prototype = Object.create(Widget.prototype);
    return ContourPlot;
}));
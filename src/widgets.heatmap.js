/**
 * Module implementing a heat map. A heat map displays a density of a variable in two dimensional space.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module heatmap
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
        global.du.widgets.HeatMap = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    'use strict';

    /**
     * The heat map widget class.
     *
     * @class HeatMap
     * @memberOf du.widgets.heatmap
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function HeatMap(name, parent) {
        var _w = Widget.call(this, name, "heatmap", "svg", parent);

        /**
         * Sets the grid size to compute heat map on.
         * Default is [40, 40].
         *
         * @method grid
         * @memberOf du.widgets.heatmap.HeatMap
         * @param {number[]} size Array of numbers containing the horizontal and vertical size of the grid..
         * @returns {du.widgets.heatmap.HeatMap} Reference to the current HeatMap.
         */
        _w.attr.add(this, 'grid', [40, 40]);

        /**
         * Enables smoothing (i.e., anti-aliasing) between cells.
         * Default is false.
         *
         * @method smooth
         * @memberOf du.widgets.heatmap.HeatMap
         * @param {boolean} on Whether to turn on smoothing.
         * @returns {du.widgets.heatmap.HeatMap} Reference to the current HeatMap.
         */
        _w.attr.add(this, 'smooth', false);

        /**
         * Adds an image to the background of the heat map. Note that the image is scaled up to fit the heat map.
         * Default is empty.
         *
         * @method background
         * @memberOf du.widgets.heatmap.HeatMap
         * @param {Object} options Object containing the background options. The following properties are supported:
         * <ul>
         *     <li><code>path</code>: Path to the image file.</li>
         *     <li><code>opacity</code>: Background opacity. Default is 1.</li>
         * </ul>
         * @returns {du.widgets.heatmap.HeatMap} Reference to the current HeatMap.
         */
        _w.attr.add(this, 'background', {});

        /**
         * Sets the opacity of the heat map. Useful when background image is used.
         * Default is 1.
         *
         * @method opacity
         * @memberOf du.widgets.heatmap.HeatMap
         * @param {number} level Opacity level to set.
         * @returns {du.widgets.heatmap.HeatMap} Reference to the current HeatMap.
         */
        _w.attr.add(this, 'opacity', 1);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _colors = null;
        var _transition = false;

        /**
         * Binds data to the heat map.
         * Expected data format: array of objects containing the {x}, {y} coordinates of the data points and a {value}
         * denoting the weight of the data point. If {value} is missing, it is assumed to be 1.
         *
         * @method data
         * @memberOf du.widgets.heatmap.HeatMap
         * @param {Array} data Data to plot.
         * @returns {du.widgets.heatmap.HeatMap} Reference to the current HeatMap.
         */
        this.data = function (data) {
            // TODO Convert data to grid size array
            // Ignore empty data
            if (typeof data === 'undefined' || data.length === 0) {
                _data = undefined;
                return this;
            }

            // Initialize data
            _data = {
                xDomain: d3.extent(data, function(d) { return d.x; }),
                yDomain: d3.extent(data, function(d) { return d.y; }),
                values: new Array((1 + _w.attr.grid[0]) * (1 + _w.attr.grid[1])).fill(0)
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

        _w.utils.tooltip = function (mouse) {
            if (!mouse) {
                return null;
            }

            // Find cell
            var x = _svg.scale.x.invert(mouse[0]),
                y = _svg.scale.y.invert(mouse[1]);
            var sx = (_data.xDomain[1] - _data.xDomain[0]) / _w.attr.grid[0],
                sy = (_data.yDomain[1] - _data.yDomain[0]) / _w.attr.grid[1];
            var i = Math.floor((x - _data.xDomain[0]) / sx),
                j = _w.attr.grid[1] - Math.ceil((y - _data.yDomain[0]) / sy);
            var value = _data.values[i + _w.attr.grid[0] * j];

            if (typeof value === 'undefined') {
                return null;
            }

            // Tooltip
            return {
                title: _w.attr.tooltipTitleFormat(value),
                stripe: _colors(value),
                content: {
                    type: 'metrics',
                    data: [
                        {label: _w.attr.xLabel + ":", value: _w.attr.tooltipXFormat(x)},
                        {label: _w.attr.yLabel + ":", value: _w.attr.tooltipYFormat(y)}
                    ]
                }
            };
        };

        function interpolateImage(imgData, data, t) {
            // Go through data
            var img = _svg.canvas.ctx.createImageData(_w.attr.grid[0], _w.attr.grid[1]);
            for (var j = 0, k = 0, l = 0; j < _w.attr.grid[1]; j++) {
                for (var i = 0; i < _w.attr.grid[0]; i++, k++, l += 4) {
                    // Get interpolated color
                    var c0 = d3.rgb(imgData[l], imgData[l + 1], imgData[l + 2], imgData[l + 3] / 255),
                        c1 = _colors(data[k]),
                        c = d3.rgb(d3.interpolateHsl(c0, c1)(t));

                    // Set current color
                    img.data[l] = c.r;
                    img.data[l + 1] = c.g;
                    img.data[l + 2] = c.b;
                    img.data[l + 3] = 255 * c.opacity;
                }
            }
            _svg.canvas.ctx.putImageData(img, 0, 0);
            return img;
        }

        // Builder
        _w.render.build = function () {
            _svg = _w.utils.standardAxis();
            _svg.plots = {};

            // Add embedded canvas
            _svg.canvas = {};
            _svg.canvas.container = _w.widget.append('foreignObject')
                .attr('x', _w.attr.margins.left + 1)
                .attr('y', _w.attr.margins.top)
                .attr('width', _w.attr.innerWidth)
                .attr('height', _w.attr.innerHeight);
            _svg.canvas.body = _svg.canvas.container.append('xhtml:body')
                .style('margin', 0)
                .style('padding', 0)
                .style('background-color', 'none')
                .style('width', '100%')
                .style('height', '100%');
            _svg.canvas.background = _svg.canvas.body.append('div')
                .style('position', 'absolute')
                .style('margin', 0)
                .style('padding', 0)
                .style('width', '100%')
                .style('height', '100%')
                .style('background-color', _w.attr.background.path ? null : 'transparent')
                .style('background-image', _w.attr.background.path ? 'url(' + _w.attr.background.path + ')' : null)
                .style("background-repeat", "none")
                .style("background-size", _w.attr.innerWidth + "px " + _w.attr.innerHeight + "px")
                .style('opacity', _w.attr.background.opacity ? _w.attr.background.opacity : null);
            _svg.canvas.canvas = _svg.canvas.body.append('canvas')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', _w.attr.grid[0])
                .attr('height', _w.attr.grid[1])
                .style('position', 'absolute')
                .style('width', _w.attr.innerWidth + 'px')
                .style('height', _w.attr.innerHeight + 'px');
            _svg.canvas.ctx = _svg.canvas.canvas.node().getContext('2d');
            _svg.canvas.img = _svg.canvas.ctx.createImageData(_w.attr.grid[0], _w.attr.grid[1]).data;
        };

        // Data updater
        _w.render.update = function (duration) {
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale(_data ? _data.xDomain : [0, 1], [0, _w.attr.innerWidth]),
                y: _w.utils.scale(_data ? _data.yDomain : [0, 1], [_w.attr.innerHeight, 0])
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

            // If data is empty or invalid, do nothing
            if (typeof _data === 'undefined' || _data.length === 0) {
                return;
            }

            // Color interpolation
            var i0 = d3.interpolateHsl(
                _w.attr.colors ? _w.attr.colors[0] : 'transparent',
                _w.attr.colors ? _w.attr.colors[1] : 'grey'
                ),
                i1 = d3.interpolateHsl(
                    _w.attr.colors ? _w.attr.colors[1] : 'grey',
                    _w.attr.colors ? _w.attr.colors[2] : 'black'
                ),
                interpolateTerrain = function (t) {
                    return t < 0.5 ? i0(t * 2) : i1((t - 0.5) * 2);
                };
            _colors = d3.scaleSequential(interpolateTerrain).domain(d3.extent(_data.values));

            // Build/update plots
            _transition = true;
            var img = _svg.canvas.ctx.createImageData(_w.attr.grid[0], _w.attr.grid[1]);
            var timer = d3.timer(function (elapsed) {
                // Create scale variable
                var t = elapsed / duration;
                interpolateImage(_svg.canvas.img, _data.values, t);

                // Stop transition
                if (t >= 1) {
                    // Finish interpolation
                    var img = interpolateImage(_svg.canvas.img, _data.values, 1);

                    // Update image data and stop transition
                    _svg.canvas.img = img.data.slice();
                    _transition = false;
                    timer.stop();
                }
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
                .attr("y", (_w.attr.innerHeight + 2.5 * _w.attr.fontSize) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);

            // Canvas
            _svg.canvas.container
                .attr('x', _w.attr.margins.left + 1)
                .attr('y', _w.attr.margins.top)
                .attr('width', _w.attr.innerWidth)
                .attr('height', _w.attr.innerHeight);
            _svg.canvas.background
                .style('background-color', _w.attr.background.path ? null : 'transparent')
                .style('background-image', _w.attr.background.path ? 'url(' + _w.attr.background.path + ')' : null)
                .style("background-size", _w.attr.innerWidth + "px " + _w.attr.innerHeight + "px")
                .style('opacity', _w.attr.background.opacity ? _w.attr.background.opacity : 1);
            _svg.canvas.canvas
                .style('width', _w.attr.innerWidth + 'px')
                .style('height', _w.attr.innerHeight + 'px')
                .style('image-rendering', _w.attr.smooth ? null : 'crisp-edges')
                .style('image-rendering', _w.attr.smooth ? null : 'pixelated')
                .style('opacity', _w.attr.opacity);
        }
    }

    // Export
    HeatMap.prototype = Object.create(Widget.prototype);
    return HeatMap;
}));
/**
 * Module implementing a semi-circular gauge widget.
 *
 * @author Enys Mones
 * @module lineargauge
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.LinearGauge = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The linear gauge widget class.
     *
     * @class LinearGauge
     * @memberOf du.widgets.lineargauge
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function LinearGauge(name, parent) {
        var _w = Widget.call(this, name, "lineargauge", "svg", parent);

        /**
         * Sets the lower boundary of the gauge.
         *
         * @method min
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value Lower boundary.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        _w.attr.add(this, "min", 0);

        /**
         * Sets the upper boundary of the gauge.
         *
         * @method max
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value Upper boundary.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        _w.attr.add(this, "max", 1);

        /**
         * Sets the thickness of the segments in pixels.
         * Default is 20.
         *
         * @method thickness
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} size Size of the thickness relative to the gauge radius.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        _w.attr.add(this, "thickness", 20);

        /**
         * Adds a tick on the left side of the gauge bar. Default is false.
         *
         * @method tick
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {boolean} on Whether to add a tick to the side of the bar.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        _w.attr.add(this, "tick", false);

        /**
         * Sets the track color for the gauge bar. Default is rgba(0, 0, 0, 0.1).
         *
         * @method trackColor
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {string} color Color of the track.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        _w.attr.add(this, "trackColor", "rgba(0, 0, 0, 0.1)");

        /**
         * Sets the min and max colors of the gauge. Must be an array with two colors. The color of intermediate segments
         * is interpolated with HSL interpolation.
         * Default values are the first red and green colors from Color Brewer (['#e41a1c', '#4daf4a']).
         *
         * @method colors
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {string[]} colors Start and end colors of the gauge.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         * @override {du.widgets.Widget.colors}
         */

            // Widget elements
        var _svg = {};
        var _scale = null;
        var _oldValue = 0;
        var _pos = null;
        var _colors = null;

        /**
         * Sets the position of the gauge.
         *
         * @method _setPosition
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value The value to set position to.
         * @param {number} duration Duration of the change animation.
         * @private
         */
        function _setPosition(value, duration) {
            // Update bar
            _svg.bar.transition().duration(duration)
                .attr("width", _scale(value) + "px")
                .style("fill", _colors(value / (_w.attr.max - _w.attr.min)));

            // Update label
            if (_svg.label) {
                //_svg.label.text(_w.attr.tickFormat(value));
                _svg.label.transition().duration(duration)
                    .tween('progress', function () {
                        return function (t) {
                            var currentVal = _oldValue + (value - _oldValue) * t;
                            return _svg.label.text(_w.attr.tickFormat(currentVal));
                        };
                    })
                    .on("end", function() {
                        _oldValue = value;
                    });
            }
        }

        /**
         * Sets the position of the gauge bar to the specified value.
         *
         * @method position
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value The value to set the gauge's position to.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current LinearGauge.
         */
        this.position = function(value) {
            _pos = value;
            return this;
        };

        // Builder
        _w.render.build = function () {
            // Calculate scale
            _scale = d3.scaleLinear()
                .domain([_w.attr.min, _w.attr.max])
                .range([0, _w.attr.innerWidth])
                .clamp(true);

            // Build gauge
            _svg.g = _w.widget.append("g");

            // Color interpolation
            _colors = d3.interpolateHsl(_w.attr.colors ? _w.attr.colors[0] : "#e41a1c",
                _w.attr.colors ? _w.attr.colors[1] : "#4daf4a");

            // Add gauge bar
            _svg.container = _svg.g.append("rect")
                .attr("x", 0)
                .attr("y", 0);
            _svg.bar = _svg.g.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .style("fill", _colors(0));

            // Add label
            if (_w.attr.tick) {
                _svg.label = _svg.g.append("text")
                    .attr("x", -5)
                    .attr("alignment-baseline", "central")
                    .attr("text-anchor", "end")
                    .text(0);
            }
        };

        // Update method
        _w.render.update = function(duration) {
            if (_pos !== null) {
                _setPosition(_pos, duration);
                _pos = null;
            }
        };

        // Style updater
        // TODO Add parameters that can be modified
        _w.render.style = function () {
            // Widget
            _w.widget.style("width", _w.attr.width + "px");
            _w.widget.style("height", _w.attr.height + "px");

            // Colors
            _colors = d3.interpolateHsl(_w.attr.colors ? _w.attr.colors[0] : "#e41a1c",
                _w.attr.colors ? _w.attr.colors[1] : "#4daf4a");

            // Elements
            _svg.g.attr("transform", "translate(" + _w.attr.margins.left + "," + (_w.attr.height - _w.attr.thickness) / 2 + ")");
            _svg.container.attr("width", _w.attr.innerWidth)
                .attr("height", _w.attr.thickness)
                .style("fill", _w.attr.trackColor);
            _svg.bar.attr("height", _w.attr.thickness);
            if (_svg.label) {
                _svg.label.attr("y", _w.attr.thickness / 2)
                    .attr("font-size", _w.attr.fontSize);
            }
        };
    }

    // Export
    LinearGauge.prototype = Object.create(Widget.prototype);
    return LinearGauge;
}));
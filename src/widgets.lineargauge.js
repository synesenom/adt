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
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "min", 0);

        /**
         * Sets the upper boundary of the gauge.
         *
         * @method max
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value Upper boundary.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "max", 1);

        /**
         * Sets the min and max color of the gauge. Must be an array with two colors. The color of intermediate segments
         * is interpolated with HSL interpolation.
         * Default values are the first red and green colors from Color Brewer (['#e41a1c', '#4daf4a']).
         *
         * @method colors
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {string[]} colors Start and end colors of the gauge.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current SemiCircularGauge.
         * @override {du.widgets.Widget.colors}
         */

            // Widget elements
        var _svg = {};
        var _scale = null;
        var _pos = null;

        /**
         * Sets the position of the gauge.
         *
         * @method _setPosition
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value The value to set position to.
         * @private
         */
        function _setPosition(value) {

        }

        /**
         * Sets the position of the needle to the specified value.
         *
         * @method position
         * @memberOf du.widgets.lineargauge.LinearGauge
         * @param {number} value The value to set the gauge's position to.
         * @returns {du.widgets.lineargauge.LinearGauge} Reference to the current SemiCircularGauge.
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
                .range([0, Math.PI])
                .clamp(true);

            // Build gauge
            _svg.g = _w.widget.append("g");

            // Color interpolation
            var colors = d3.interpolateHsl(_w.attr.colors ? _w.attr.colors[0] : "#e41a1c",
                _w.attr.colors ? _w.attr.colors[1] : "#4daf4a");
        };

        // Update method
        _w.render.update = function() {
            if (_pos !== null) {
                _setPosition(_pos);
                _pos = null;
            }
        };

        // Style updater
        // TODO add paramters that can be modified
        _w.render.style = function () {
            // Widget
            _w.widget.style("width", _w.attr.width + "px");
            _w.widget.style("height", _w.attr.height + "px");

            // Elements
            _svg.g
                .attr("transform", "translate(0,0)");
        };
    }

    // Export
    LinearGauge.prototype = Object.create(Widget.prototype);
    return LinearGauge;
}));
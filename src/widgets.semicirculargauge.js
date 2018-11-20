/**
 * Module implementing a semi-circular gauge widget.
 *
 * @author Enys Mones
 * @module semicirculargauge
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
        global.du.widgets.SemiCircularGauge = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The semi-circular gauge widget class.
     *
     * @class SemiCircularGauge
     * @memberOf du.widgets.semicirculargauge
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function SemiCircularGauge(name, parent) {
        var _w = Widget.call(this, name, "semicirculargauge", "svg", parent);

        /**
         * Sets the lower boundary of the gauge.
         *
         * @method min
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} value Lower boundary.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "min", 0);

        /**
         * Sets the upper boundary of the gauge.
         *
         * @method max
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} value Upper boundary.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "max", 1);

        /**
         * Sets the number of segments of the gauge bar.
         * Default value is 4.
         *
         * @method segments
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} num Number of segments.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, 'segments', 4);

        /**
         * Sets the angle of the gap between segments.
         * Default value is 6 degrees.
         *
         * @method gap
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} num Gap angle between segments in degrees.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "gap", 6);

        /**
         * Sets the thickness of the segments in units of the radius.
         * Default is 0.2.
         *
         * @method thickness
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} size Size of the thickness relative to the gauge radius.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         */
        _w.attr.add(this, "thickness", 0.2);

        /**
         * Sets the min and max color of the gauge. Must be an array with two colors. The color of intermediate segments
         * is interpolated with HSL interpolation.
         * Default values are the first red and green colors from Color Brewer (['#e41a1c', '#4daf4a']).
         *
         * @method colors
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {string[]} colors Start and end colors of the gauge.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
         * @override {du.widgets.Widget.colors}
         */

        // Widget elements
        var _svg = {};
        var _scale = null;
        var _oldPos = 0;
        var _pos = undefined;

        /**
         * Computes the current geometry of the gauge.
         *
         * @method _geometry
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @returns {Object} Object describing the gauge geometry.
         * @private
         */
        function _geometry() {
            var gapAngle = _w.attr.gap * Math.PI / 180,
                totalAngle = Math.PI - (_w.attr.segments - 1) * gapAngle,
                segmentAngle = totalAngle / _w.attr.segments;
            var radius = _w.attr.innerWidth / 2,
                thickness = radius * _w.attr.thickness;
            var needleWidth = radius * 0.1,
                needleLength = radius - 1.5 * thickness;

            return {
                angles: {
                    gap: gapAngle,
                    segment: segmentAngle
                },
                sizes: {
                    radius: radius,
                    thickness: thickness
                },
                needle: {
                    width: needleWidth,
                    length: needleLength,
                    angle: Math.acos(needleWidth / needleLength)
                }
            };
        }

        /**
         * Calculates needle path based on the geometry and the new angle.
         *
         * @method _getNeedlePath
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {Object} geo Object containing the current geometry of the gauge.
         * @param {number} angle New angle to turn needle to.
         * @returns {string} The needle geometry to be passed for attribute {d}.
         * @private
         */
        function _getNeedlePath(geo, angle) {
            var needleTop = [-geo.needle.length * Math.cos(angle), -geo.needle.length * Math.sin(angle)],
                needleLeft = [geo.needle.width * Math.cos(angle - geo.needle.angle),
                    geo.needle.width * Math.sin(angle - geo.needle.angle)],
                needleRight = [geo.needle.width * Math.cos(angle + geo.needle.angle),
                    geo.needle.width * Math.sin(angle + geo.needle.angle)];
            return "M0,0L" + needleLeft.join(",") + "L" + needleTop.join(",") + "L" + needleRight.join(",") + "Z";
        }

        /**
         * Sets the position of the gauge.
         *
         * @method _setPosition
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {?number} value The value to set position to. If value is null, the needle is hidden.
         * @param {number} duration Duration of the transition.
         * @private
         */
        function _setPosition(value, duration) {
            if (value === null) {
                _svg.needlePointer
                    .attr("d", "");
                return;
            }

            // Update needle
            var geo = _geometry();
            var self = this;
            var oldAngle = _scale(_oldPos);
            var angle = _scale(value);
            _svg.needlePointer.transition().duration(duration)
                .tween('progress', function () {
                    return function (t) {
                        var progress = oldAngle + (angle - oldAngle) * t;
                        return _svg.needlePointer
                            .attr("d", _getNeedlePath.call(self, geo, progress));
                    };
                })
                .on("end", function() {
                    _oldPos = value;
                });
        }

        /**
         * Sets the position of the needle to the specified value.
         *
         * @method position
         * @memberOf du.widgets.semicirculargauge.SemiCircularGauge
         * @param {number} value The value to set the needle's position to. If value is set to null, the needle
         * is hidden.
         * @returns {du.widgets.semicirculargauge.SemiCircularGauge} Reference to the current SemiCircularGauge.
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

            // Add segments
            _svg.segments = [];
            var geo = _geometry();
            for (var i=0; i<_w.attr.segments; i++) {
                // Calculate arc
                var arc = d3.arc().outerRadius(geo.sizes.radius)
                    .innerRadius(geo.sizes.radius - geo.sizes.thickness)
                    .startAngle(-Math.PI / 2 + i * (geo.angles.segment + geo.angles.gap))
                    .endAngle(-Math.PI / 2 + (i+1) * (geo.angles.segment + geo.angles.gap) - geo.angles.gap);

                // Add element
                _svg.segments.push(
                    _svg.g.append("path")
                        .attr("d", arc)
                        .style("fill", colors(i / (_w.attr.segments - 1)))
                );
            }

            // Add needle
            _svg.needle = _svg.g.append("g")
                .style("fill", _w.attr.fontSize);
            _svg.needleCenter = _svg.needle.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", geo.needle.width + "px");
            _svg.needlePointer = _svg.needle.append("path");

            // Set position
            _setPosition(0, 0);
        };

        // Update method
        _w.render.update = function(duration) {
            if (typeof _pos !== 'undefined') {
                _setPosition(_pos, duration);
                _pos = undefined;
            }
        };

        // Style updater
        // TODO Add parameters that can be modified
        _w.render.style = function () {
            // Widget
            _w.widget.style("width", _w.attr.width + "px");
            _w.widget.style("height", _w.attr.height + "px");

            // Elements
            _svg.g.attr("transform", "translate(" + _w.attr.width / 2 + "," + 0.5 * (_w.attr.height + _w.attr.innerWidth / 2) + ")");
        };
    }

    // Export
    SemiCircularGauge.prototype = Object.create(Widget.prototype);
    return SemiCircularGauge;
}));
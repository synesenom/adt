/**
 * Module implementing a track pad, which is simply a 2D slider.
 *
 * @author Enys Mones
 * @module trackpad
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
// TODO expand overlay outside inset
// TODO add vertical axis
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.TrackPad = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The track pad widget class.
     *
     * @class TrackPad
     * @memberOf du.widgets.trackpad
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function TrackPad(name, parent) {
        var _w = Widget.call(this, name, "slider", "svg", parent);

        /**
         * Sets the range for the horizontal dimension.
         * Default is [0, 1].
         *
         * @method xRange
         * @methodOf du.widgets.trackpad.TrackPad
         * @param {Array} range Array containing the lower and upper boundaries of the horizontal range.
         * @returns {du.widgets.trackpad.TrackPad} Reference to the current TrackPad.
         */
        _w.attr.add(this, "xRange", [0, 1]);

        /**
         * Sets the range for the vertical dimension.
         * Default is [0, 1].
         *
         * @method yRange
         * @methodOf du.widgets.trackpad.TrackPad
         * @param {Array} range Array containing the lower and upper boundaries of the vertical range.
         * @returns {du.widgets.trackpad.TrackPad} Reference to the current TrackPad.
         */
        _w.attr.add(this, "yRange", [0, 1]);

        /**
         * Sets callback attached to the track pad. Must accept two parameter describing the position of the track pad.
         * By default no callback is set.
         *
         * @method callback
         * @memberOf du.widgets.trackpad.TrackPad
         * @param {function} func The callback to call on value change.
         * @returns {du.widgets.trackpad.TrackPad} Reference to the current TrackPad.
         */
        _w.attr.add(this, "callback", null);

        /**
         * Enables the horizontal and vertical lines that help see the value of the trackpad.
         * Default is false.
         *
         * @method guide
         * @memberOf du.widgets.trackpad.TrackPad
         * @param {boolean} on Whether guiding lines are enabled.
         * @returns {du.widgets.trackpad.TrackPad} Reference to the current TrackPad.
         */
        _w.attr.add(this, "guide", false);

        // Widget elements
        var _svg = {};
        var _scale = null;

        // Builder
        _w.render.build = function () {
            // Create scales
            _scale = {
                x: d3.scaleLinear()
                    .domain(_w.attr.xRange)
                    .range([0, _w.attr.width - _w.attr.margins.left - _w.attr.margins.right])
                    .clamp(true),
                y: d3.scaleLinear()
                    .domain(_w.attr.yRange)
                    .range([0, _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom])
                    .clamp(true)
            };

            _svg.g = _w.widget.append("g")
                .attr("transform", "translate(" + _w.attr.margins.left + ",20)");
            _svg.track = _svg.g.append("rect")
                .attr("rx", "3")
                .attr("ry", "3")
                .attr("x", _scale.x.range()[0])
                .attr("y", _scale.y.range()[0])
                .attr("width", (_w.attr.width - _w.attr.margins.left - _w.attr.margins.right) + "px")
                .attr("height", (_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom) + "px");
            _svg.inset = _svg.track
                .select(function () {
                    return this.parentNode.appendChild(this.cloneNode(true));
                })
                .style("fill", "white")
                .style("opacity", 0.9)
                .attr("rx", "2.5")
                .attr("ry", "2.5")
                .attr("x", _scale.x.range()[0] + 0.5)
                .attr("y", _scale.y.range()[0] + 0.5)
                .attr("width", (_w.attr.width - _w.attr.margins.left - _w.attr.margins.right - 1) + "px")
                .attr("height", (_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - 1) + "px");
            if (_w.attr.guide) {
                _svg.guide = {
                    h: _svg.g.append("line")
                        .attr("x1", _scale.x.range()[0])
                        .attr("y1", _scale.y.range()[0])
                        .attr("x2", _scale.x.range()[1])
                        .attr("y2", _scale.y.range()[0])
                        .attr("stroke-dasharray", "3, 6")
                        .style("stroke", _w.attr.fontColor)
                        .style("stroke-width", "1px"),
                    v: _svg.g.append("line")
                        .attr("x1", _scale.x.range()[0])
                        .attr("y1", _scale.y.range()[0])
                        .attr("x2", _scale.x.range()[0])
                        .attr("y2", _scale.y.range()[1])
                        .attr("stroke-dasharray", "3, 6")
                        .style("stroke-width", "1px")
                };
            }
            _svg.overlay = _svg.inset
                .select(function () {
                    return this.parentNode.appendChild(this.cloneNode(true));
                })
                .attr("class", "track-overlay")
                .style("pointer-events", "all")
                .style("cursor", "pointer")
                .style("fill", "transparent")
                .call(d3.drag()
                    .on("start drag", function () {
                        var x = _scale.x.invert(d3.event.x),
                            y = _scale.y.invert(d3.event.y);
                        _svg.handle
                            .attr("cx", _scale.x(x))
                            .attr("cy", _scale.y(y));
                        if (_svg.guide) {
                            _svg.guide.h
                                .attr("x1", _scale.x.range()[0])
                                .attr("y1", _scale.y(y))
                                .attr("x2", _scale.x.range()[1])
                                .attr("y2", _scale.y(y));
                            _svg.guide.v
                                .attr("x1", _scale.x(x))
                                .attr("y1", _scale.y.range()[0])
                                .attr("x2", _scale.x(x))
                                .attr("y2", _scale.y.range()[1]);
                        }
                        _w.attr.callback && _w.attr.callback(x, y);
                    }));
            _svg.axis = {
                x: _svg.g.append("g")
                    .attr("class", "x axis")
                    .style("font-family", "inherit")
                    .style("fill", "none"),
                y: _svg.g.append("g")
                    .attr("class", "x axis")
                    .style("font-family", "inherit")
                    .style("fill", "none")
            };
            _svg.handle = _svg.g.insert("circle", ".track-overlay")
                .style("fill", "white")
                .style("stroke-width", "0.5px")
                .attr("r", 7);
        };

        // Style updater
        _w.render.style = function () {
            // Widget
            _w.widget.style("width", _w.attr.width + "px");
            _w.widget.style("height", _w.attr.height + "px");

            // Elements
            _scale.x.range([0, _w.attr.width - _w.attr.margins.left - _w.attr.margins.right]);
            _scale.y.range([0, _w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom]);
            _svg.track
                .style("fill", _w.attr.fontColor)
                .attr("x", _scale.x.range()[0])
                .attr("y", _scale.y.range()[0])
                .attr("width", (_w.attr.width - _w.attr.margins.left - _w.attr.margins.right) + "px")
                .attr("height", (_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom) + "px");
            _svg.inset
                .attr("x", _scale.x.range()[0] + 0.5)
                .attr("y", _scale.y.range()[0] + 0.5)
                .attr("width", (_w.attr.width - _w.attr.margins.left - _w.attr.margins.right - 1) + "px")
                .attr("height", (_w.attr.height - _w.attr.margins.top - _w.attr.margins.bottom - 1) + "px");
            if (_w.attr.guide) {
                _svg.guide.h.style("stroke", _w.attr.fontColor);
                _svg.guide.v.style("stroke", _w.attr.fontColor);
            }
            _svg.overlay
                .attr("x", _scale.x.range()[0] - _w.attr.margins.left + 10)
                .attr("y", _scale.y.range()[0] - _w.attr.margins.top + 10)
                .attr("width", (_w.attr.width - 20) + "px")
                .attr("height", (_w.attr.height - 20) + "px");
            _svg.axis.x
                .attr("transform", "translate(-1," + (_w.attr.height - _w.attr.margins.bottom - 30) + ")")
                .call(d3.axisBottom()
                    .ticks(5).scale(_scale.x));
            _svg.axis.y.call(d3.axisLeft()
                .ticks(5).scale(_scale.y));
            _svg.g.selectAll("path")
                .style("fill", "none")
                .style("stroke", "none");
            _svg.g.selectAll(".tick > line")
                .style("fill", "none")
                .style("stroke", "none");
            _svg.g.selectAll("text")
                .attr("font-size", _w.attr.fontSize + "px")
                .attr("fill", _w.attr.fontColor);
            _svg.handle
                .style("stroke", _w.attr.fontColor);
        };
    }

    // Export
    TrackPad.prototype = Object.create(Widget.prototype);
    return TrackPad;
}));
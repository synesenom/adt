/**
 * A progress bar widget.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module progressbar
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
        global.du.widgets.ProgressBar = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The progress bar widget class.
     *
     * @class ProgressBar
     * @memberOf du.widgets.progressbar
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function ProgressBar(name, parent) {
        var _w = Widget.call(this, name, "progressbar", "div", parent);

        /**
         * Sets the color of the progress bar track.
         * Default is transparent.
         *
         * @method trackColor
         * @memberOf du.widgets.progressbar.ProgressBar
         * @param {string} color Color of the progress bar track.
         * @returns {du.widgets.progressbar.ProgressBar} Reference to the current Progress bar.
         */
        _w.attr.add(this, "trackColor", "transparent");

        /**
         * Sets the progress bar thickness in pixels.
         * Default is 1px.
         *
         * @method thickness
         * @memberOf du.widgets.progressbar.ProgressBar
         * @param {number} value Thickness value in pixels.
         * @returns {du.widgets.progressbar.ProgressBar} Reference to the current Progress bar.
         */
        _w.attr.add(this, "thickness", 1);

        /**
         * Sets the text alignment for the label.
         * Default is center.
         *
         * @method align
         * @memberOf du.widgets.progressbar.ProgressBar
         * @param {string} alignment The alignment to set.
         * @returns {du.widgets.progressbar.ProgressBar} Reference to the current Progress bar.
         */
        _w.attr.add(this, "align", "center");

        /**
         * Sets the percentage of the progress bar.
         *
         * @method percentage
         * @methodOf du.widgets.progressbar.ProgressBar
         * @param {number} value Value ot percentage to set bar to.
         * @returns {du.widgets.progressbar.ProgressBar} Reference to the current Progress bar.
         */
        _w.attr.add(this, "percentage", 0);

        // Widget elements
        var _div = {};

        // Builder
        _w.render.build = function () {
            _div.g = _w.widget.append("div")
                .style("position", "absolute")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "table");
            _div.container = _div.g.append("div")
                .style("display", "table-cell")
                .style("vertical-align", "middle")
                .style("pointer-events", "none")
                .style("height", "100%");
            _div.label = _div.container.append("div")
                .style("display", "block")
                .style("margin-bottom", "2px")
                .style("pointer-events", "none");
            _div.barTrack = _div.container.append("div")
                .style("display", "block")
                .style("width", "100%")
                .style("bottom", "0")
                .style("background-color", _w.attr.trackColor);
            _div.bar = _div.barTrack.append("div")
                .style("display", "block")
                .style("float", "left")
                .style("width", "0%")
                .style("height", "100%");
        };

        _w.render.update = function (duration) {
            _div.bar.transition().duration(duration)
                .style("width", _w.attr.percentage + "%");
        };

        // Style updater
        _w.render.style = function () {
            _div.container
                .style("text-align", _w.attr.align);
            _div.label.style("color", _w.attr.fontColor)
                .style("height", _w.attr.fontSize + "px")
                .style("line-height", _w.attr.fontSize + "px")
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.label);
            _div.barTrack.style("height", _w.attr.thickness + "px");
            _div.bar.style("background-color", _w.attr.fontColor);
        };
    }

    // Export
    ProgressBar.prototype = Object.create(Widget.prototype);
    return ProgressBar;
}));
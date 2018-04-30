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

        // Widget elements
        var _div = {};

        /**
         * Sets the percentage of the progress bar.
         *
         * @method percentage
         * @methodOf du.widgets.progressbar.ProgressBar
         * @param {number} value Value ot percentage to set bar to.
         * @returns {du.widgets.progressbar.ProgressBar}
         */
        this.percentage = function(value) {
            _div.bar.style("width", value + "%");
            return this;
        };

        // Builder
        _w.render.build = function() {
            _div.g = _w.widget.append("div")
                .style("position", "absolute")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "table");
            _div.container = _div.g.append("div")
                .style("display", "table-cell")
                .style("vertical-align", "middle")
                .style("pointer-events", "none")
                .style("height", "50px");
            _div.label = _div.container.append("div")
                .style("display", "block")
                .style("text-align", "center")
                .style("pointer-events", "none");
            _div.barTrack = _div.container.append("div")
                .style("display", "block")
                .style("width", "100%")
                .style("height", "1px")
                .style("bottom", "0");
            _div.bar = _div.barTrack.append("div")
                .style("display", "block")
                .style("float", "left")
                .style("width", "43%")
                .style("height", "100%")
                .style("background-color", "dodgerblue");
        };

        // Style updater
        _w.render.style = function() {
            _div.label.style("color", _w.attr.fontColor)
                .text(_w.attr.label);
            _div.bar.style("background-color", _w.attr.fontColor);
        };
    }

    // Export
    ProgressBar.prototype = Object.create(Widget.prototype);
    return ProgressBar;
}));
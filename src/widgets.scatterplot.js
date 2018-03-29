/**
 * Module implementing a scatter plot.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module scatterplot
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires lodash@4.17.4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'lodash', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.ScatterPlot = factory(global.d3, global._, global.du.Widget);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The scatter plot widget class.
     *
     * @class ScatterPlot
     * @memberOf du.widgets.scatterplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function ScatterPlot(name, parent) {
        var _w = Widget.call(this, name, "scatterplot", "svg", parent);

        /**
         * Sets the opacity of the area plots.
         * Default is 0.3.
         *
         * @method opacity
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {number} value The opacity value to set.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        _w.attr.add(this, "opacity", 0.4);

        // Widget elements.
        var _svg = {};
        var _data = [];

        /**
         * Binds data to the scatter plot.
         * Expected data format: array of objects with properties {x} and {y}, where both {x} and {y} are objects
         * containing the coordinates for each quantity to plot.
         *
         * @method data
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {Array} data Data to plot.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.data = function(data) {

        };

        /**
         * Highlights the specified plot.
         *
         * @method highlight
         * @memberOf du.widgets.scatterplot.ScatterPlot
         * @param {string} key Key of the area to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.scatterplot.ScatterPlot} Reference to the current ScatterPlot.
         */
        this.highlight = function(key, duration) {
            return _w.utils.highlight(this, _svg, ".area", key, duration);
        };

        // Tooltip builder
        _w.utils.tooltip = function(mouse) {

        };

        // Builder
        _w.render.build = function() {

        };

        // Data updater
        _w.render.update = function(duration) {

        };

        // Style updater
        _w.render.style = function() {

        };
    }

    // Export
    ScatterPlot.prototype = Object.create(Widget.prototype);
    return ScatterPlot;
}));
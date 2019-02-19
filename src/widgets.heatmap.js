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
        var _w = Widget.call(this, name, "heatmap", "div", parent);

    }

    // Export
    HeatMap.prototype = Object.create(Widget.prototype);
    return HeatMap;
}));
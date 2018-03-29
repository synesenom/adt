/**
 * Module implementing a dynamic tooltip.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module widgets.tooltip
 * @memberOf du.widgets
 * @requires d3
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('../widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Tooltip = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The tooltip widget class.
     * A tooltip is a moving container of other widgets that can be removed instantly. It is always added to body as
     * parent.
     * Part of the Analytics Office map dashboard utils.
     *
     * @class Tooltip
     * @memberOf du.widgets
     * @requires d3@v4
     * @requires du.widgets
     * @constructor
     */
    function Tooltip() {
        // Tooltip ids
        var _id = "du-widgets-tooltip-tooltip";

        // Remove existing tooltip
        d3.select("#" + _id).remove();
        var _w = Widget.call(this, "tooltip", "tooltip", "div");

        /**
         * @property {number} offsetX Horizontal offset to correct with.
         * @memberOf du.widgets.Tooltip
         */
        _w.attr.add(this, "offsetX", 0);

        /**
         * @property {number} offsetY Vertical offset to correct with.
         * @memberOf du.widgets.Tooltip
         */
        _w.attr.add(this, "offsetY", 0);

        /**
         * Widget elements.
         */
        var _content = d3.select(document.createElement("div"));

        this.content = function() {
            return _content;
        };

        // Builder
        _w.render.build = function() {
            document.getElementById(_id).appendChild(_content.node());
        };

        // Style updater
        _w.render.style = function() {
            // Set position
            var dx = Math.max(_w.attr.offsetX, _w.attr.width);
            var dy = Math.max(_w.attr.offsetY, _w.attr.height);
            _w.widget.style("position", "absolute")
                .style("height", null)
                .style("border-radius", "2px")
                .style("background-color", "rgba(0, 0, 0, 0.7)")
                .style("box-shadow", "0 0 2px white")
                .style("pointer-events", "none")
                .style("left",
                    ((d3.event.pageX < window.innerWidth - dx ? d3.event.pageX : d3.event.pageX - dx) + 20) + "px")
                .style("top",
                    ((d3.event.pageY < window.innerHeight - dy ? d3.event.pageY : d3.event.pageY - dy) + 20) + "px");
            _w.widget.style("display", "block");
        };
    }

    Tooltip.prototype = Object.create(Widget.prototype);
    return Tooltip;
}));
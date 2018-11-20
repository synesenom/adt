/**
 * Module implementing a checkbox.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module checkbox
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Checkbox = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The checkbox widget class.
     *
     * @class Checkbox
     * @memberOf du.widgets.checkbox
     * @param {string} name Identifier of the legend.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Checkbox(name, parent) {
        var _w = Widget.call(this, name, "legend", "div", parent);

        /**
         * Sets callback attached to the checkbox. Must accept one {boolean} parameter describing the value of the
         * checkbox after the change. By default, no callback is set.
         *
         * @method callback
         * @memberOf du.widgets.checkbox.Checkbox
         * @param {function} func The callback to call on checked change.
         * @returns {du.widgets.checkbox.Checkbox} Reference to the current checkbox.
         */
        _w.attr.add(this, "callback", null);

        /**
         * Sets the checkbox checked. Note that calling this method will also trigger the callback.
         *
         * @method check
         * @memberOf du.widgets.checkbox.Checkbox
         * @param {boolean} checked Whether the checkbox should be checked.
         * @returns {du.widgets.checkbox.Checkbox} Reference to the current checkbox.
         */
        this.check = function(checked) {
            _checked = checked;
            return this;
        };

        // Widget elements.
        var _svg = {};
        var _checked = null;

        // Builder
        _w.render.build = function () {
            _svg.g = _w.widget.append("div")
                .style("position", "absolute")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "table");
            _svg.container = _svg.g.append("div")
                .style("display", "table-cell")
                .style("vertical-align", "middle");
            _svg.label = _svg.container.append("label")
                .style("display", "inline-block")
                .style("position", "relative")
                .style("cursor", "pointer")
                .style("user-select", "none")
                .style("padding-left", 1.8 * _w.attr.fontSize + "px")
                .text(_w.attr.label);
            _svg.input = _svg.label.append("input")
                .attr("type", "checkbox")
                .property("checked", false)
                .style("position", "absolute")
                .style("opacity", 0)
                .style("width", 0)
                .style("height", 0)
                .style("cursor", "pointer")
                .on("change", function() {
                    var checked = d3.select(this).property("checked");

                    // Update checkbox
                    _svg.box.style("opacity", checked ? 1 : 0.1);
                    _svg.checkmark.style("display", checked ? "block" : "none");

                    // Call callback
                    _w.attr.callback && _w.attr.callback(checked);
                });
            _svg.box = _svg.container.append("span")
                .style("position", "absolute")
                .style("display", "inline-block")
                .style("top", 0)
                .style("left", 0)
                .style("width", 1.2 * _w.attr.fontSize + "px")
                .style("height", 1.2 * _w.attr.fontSize + "px")
                .style("margin-top", 0.5 * (_w.attr.height - 1.2 * _w.attr.fontSize) + "px")
                .style("background-color", _w.attr.colors)
                .style("opacity", 0.1);
            _svg.checkmark = _svg.box.append("span")
                .style("position", "absolute")
                .style("display", "none")
                .style("left", 0.45 * _w.attr.fontSize + "px")
                .style("top", 0.15 * _w.attr.fontSize + "px")
                .style("width", 0.35 * _w.attr.fontSize + "px")
                .style("height", 0.7 * _w.attr.fontSize + "px")
                .style("border", "solid white")
                .style("border-width", "0 " + 0.1 * _w.attr.fontSize + "px " + 0.1 * _w.attr.fontSize + "px 0")
                .style("transform", "rotate(45deg)");
        };

        _w.render.update = function() {
            if (_checked !== null) {
                // Update checkbox
                _svg.input.property("checked", _checked);
                _svg.box.style("opacity", _checked ? 1 : 0.1);
                _svg.checkmark.style("display", _checked ? "block" : "none");
                _checked = null;
            }
        };

        // Style updater
        _w.render.style = function () {
            _w.widget
                .style("font-size", _w.attr.fontSize + "px");
        };
    }

    // Export
    Checkbox.prototype = Object.create(Widget.prototype);
    return Checkbox;
}));
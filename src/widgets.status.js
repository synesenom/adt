/**
 * Module implementing an status widget.
 *
 * A status is a 'label: status' pair.
 *
 * @copyright Copyright (C) 2017 Sony Mobile Communications Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * @author Enys Mones (enys.mones@sony.com)
 * @module status
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
 // TODO set status only on build not in style updater
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Status = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The status widget class.
     *
     * @class Status
     * @memberOf du.widgets.status
     * @param {string} name Identifier of the status widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * Accepts HTML formatting.
     * @constructor
     */
    function Status(name, parent) {
        var _w = Widget.call(this, name, "status", "div", parent);

        /**
         * Sets the current status value.
         *
         * @method value
         * @memberOf du.widgets.status.Status
         * @param {string} text Status value text.
         */
        _w.attr.add(this, "value", "");

        // Widget elements.
        var _svg = {};

        // Builder
        _w.render.build = function() {
            _svg.g = _w.widget.append("div")
                .style("position", "absolute")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "table");
            _svg.label = _svg.g.append("div")
                .style("display", "table-cell")
                .style("position", "relative")
                .style("vertical-align", "middle")
                .style("width", "25%")
                .style("pointer-events", "none")
                .text(_w.attr.label);
            _svg.status = _svg.g.append("div")
                .style("display", "table-cell")
                .style("position", "relative")
                .style("vertical-align", "middle")
                .style("width", "75%")
                .style("text-align", "right")
                .style("pointer-events", "none");
        };

        // Style updater
        _w.render.style = function() {
            _w.widget
                .style("font-size", _w.attr.fontSize + "px")
                .style("pointer-events", "none");

            _.forOwn(_w.attr.margins, function(margin, side) {
                _w.widget.style("margin-" + side, margin + "px");
            });
            _.forOwn(_w.attr.borders, function(border, side) {
                _w.widget.style("border-" + side, border);
            });
            _svg.label
                .style("color", _w.attr.fontColor)
                .style("font-weight", _w.attr.fontWeight);
            _svg.status
                .style("color", _w.attr.fontColor)
                .style("font-weight", _w.attr.fontWeight)
                .text(_w.attr.value);
        };
    }

    // Export
    Status.prototype = Object.create(Widget.prototype);
    return Status;
}));
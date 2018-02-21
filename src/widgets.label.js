/**
 * Module implementing an interactive bar chart.
 * Part of the Analytics Dashboard Tools.
 *
 * A label is a static piece of text.
 * Part of the Analytics Office map dashboard utils.
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
 * @module label
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.widgets.Widget
 */
 // TODO set text only on build not in style updater
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widgets'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'widgets', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Label = factory(global.d3, global.du.widgets.Widget, global);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The label widget class.
     *
     * @class Label
     * @memberOf du.widgets.label
     * @param {string} name Identifier of the label.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Label(name, parent) {
        var _w = Widget.call(this, name, "label", "div", parent);

        /**
         * Sets text of the label.
         *
         * @method text
         * @memberOf du.widgets.label.Label
         * @param {string} label Text of the label.
         */
        _w.attr.add(this, "text", "");

        /**
         * Sets label text alignment.
         * Default is center.
         *
         * @method align
         * @memberOf du.widgets.label.Label
         * @param {string} alignment The alignment to set.
         */
        _w.attr.add(this, "align", "center");

        // Style updater
        _w.render.style = function() {
            _w.widget
                .style("color", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .style("font-weight", _w.attr.fontWeight)
                .style("text-align", _w.attr.align)
                .style("pointer-events", "none")
                .html(_w.attr.text);
            _.forOwn(_w.attr.margins, function(margin, side) {
                _w.widget.style("margin-" + side, margin + "px");
            });
            _.forOwn(_w.attr.borders, function(border, side) {
                _w.widget.style("border-" + side, border);
            });
        };
    }

    // Export
    Label.prototype = Object.create(Widget.prototype);
    return Label;
}));
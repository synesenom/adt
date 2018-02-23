/**
 * Module implementing a colored legend.
 *
 * A legend is a static label together with a colored square.
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
 * @module legend
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.widgets.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('./widgets'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', '_', 'widgets', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Legend = factory(global.d3, global._, global.du.widgets.Widget, global);
    }
} (this, function (d3, _, Widget) {
    "use strict";

    /**
     * The legend widget class.
     *
     * @class Legend
     * @memberOf du.widgets.legend
     * @param {string} name Identifier of the legend.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Legend(name, parent) {
        var _w = Widget.call(this, name, "legend", "div", parent);

        /**
         * Sets legend color.
         * Default is white.
         *
         * @method color
         * @memberOf du.widgets.legend.Legend
         * @param {string} color Color to use.
         */
        _w.attr.add(this, "color", "white");

        /**
         * Makes legend two-column wide.
         * Default is false.
         *
         * @method twoColumns
         * @memberOf du.widgets.legend.Legend
         * @param {number} on Whether legend should be two columned.
         */
        _w.attr.add(this, "twoColumns", false);

        // Widget elements.
        var _svg = {};

        /**
         * Highlights the specified legend.
         *
         * @method highlight
         * @memberOf du.widgets.legend.Legend
         * @param {string} key Label of the legend to highlight.
         * @param {number} duration Duration of the highlight animation.
         */
        this.highlight = function(key, duration) {
            _w.utils.highlight(_svg, ".legend-entry", key, duration);
        };

        // Builder
        _w.render.build = function() {
            _svg.g = _w.widget.append("div")
                .style("display", "block")
                .style("position", "relative");

            _svg.legends = {};
            _.forOwn(_w.attr.colors, function(color, label) {
                var g = _svg.g.append("div")
                    .attr("class", "legend-entry " + _w.utils.encode(label))
                    .style("display", "inline-block")
                    .style("position", "relative")
                    .style("width", "100%")
                    .style("margin-bottom", "6px")
                    .style("vertical-align", "top")
                    .style("pointer-event", "all");
                var square = g.append("div")
                    .style("display", "inline-block")
                    .style("position", "relative")
                    .style("float", "left")
                    .style("cursor", "pointer");
                var text = g.append("div")
                    .style("display", "inline-block")
                    .style("position", "relative")
                    .style("float", "right")
                    .style("cursor", "pointer")
                    .text(label);
                _svg.legends[label] = {
                    color: color,
                    g: g,
                    square: square,
                    text: text
                };
            });
        };

        // Style updater
        _w.render.style = function() {
            _svg.g
                .style("width", _w.attr.width + 'px')
                .style("height", _w.attr.height + 'px')
                .style("pointer-events", "all");

            _.forOwn(_svg.legends, function(legend, label) {
                legend.g
                    .style("width", _w.attr.twoColumns ? "50%" : "100%");

                legend.square
                    .style("width", 0.7 * _w.attr.fontSize + "px")
                    .style("height", 0.7 * _w.attr.fontSize + "px")
                    .style("margin", 0.15 * _w.attr.fontSize + "px " + 0.15 * _w.attr.fontSize + "px")
                    .style("background-color", legend.color)
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(label);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(label);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(label);
                    });
                legend.text
                    .style("width", "calc(100% - " + 1.2 * _w.attr.fontSize + "px)")
                    .style("line-height", _w.attr.fontSize + "px")
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(label);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(label);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(label);
                    });
            });
        }
    }

    // Export
    Legend.prototype = Object.create(Widget.prototype);
    return Legend;
}));
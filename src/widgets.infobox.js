/**
 * Module implementing an info notification.
 *
 * An info box is a small window together with a transparent full-width background.
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
 * @module infobox
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
        global.du.widgets.InfoBox = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The info widget class.
     *
     * @class InfoBox
     * @memberOf du.widgets.infobox
     * @constructor
     */
    var InfoBox = (function () {
        var _infoBox = null;

        function _InfoBox() {
            // If exists, remove it
            if (_infoBox) {
                _infoBox.remove();
            }

            var _w = Widget.call(this, "infobox", "infobox", "div");
            _infoBox = _w.widget;

            /**
             * Sets the info box content.
             *
             * @method content
             * @memberOf du.widgets.infobox.InfoBox
             * @param {string} text Content of the info box. Can be HTML formatted.
             * @returns {du.widgets.infobox.InfoBox} Reference to the current Info.
             */
            _w.attr.add(this, "content", "");

            /**
             * Sets the background color of the info box.
             * Default is black.
             *
             * @method backgroundColor
             * @memberOf du.widgets.infobox.InfoBox
             * @param {string} color Color to set background to.
             * @returns {du.widgets.infobox.InfoBox} Reference to the current Info.
             */
            _w.attr.add(this, "backgroundColor", "#fff");

            // Widget elements.
            var _box = null;
            var _content = null;

            // Builder
            _w.render.build = function (duration) {
                _w.widget
                    .style("display", "none")
                    .style("opacity", 0)
                    .on("click", function () {
                        d3.select(this)
                            .transition().duration(duration)
                            .style("opacity", 0)
                            .on("end", function () {
                                _infoBox.remove();
                            });
                    });

                // Add box
                _box = _w.widget.append("div")
                    .style("position", "absolute")
                    .style("top", 0)
                    .style("left", "50%")
                    .style("width", "50%")
                    .style("padding", "20px")
                    .style("margin-left", "calc(-25% - 10px)")
                    .style("margin-top", "100px")
                    .style("box-shadow", "1px 1px 4px grey")
                    .style("border-radius", "3px");

                // Add content
                _content = _box.append("div")
                    .style("padding", "10px")
                    .style("min-height", "100px")
                    .style("font-size", "14pt")
                    .style("text-align", "left")
                    .style("overflow", "scroll");
            };

            // Style updater
            _w.render.style = function () {
                var bg = d3.color("white");

                _w.widget
                    .style("width", "100%")
                    .style("height", "100%")
                    .style("top", "0")
                    .style("left", "0")
                    .style("pointer-events", "all")
                    .style("background-color", "rgba(" + bg.rgb().r + "," + bg.rgb().g + "," + bg.rgb().b + ",0.9)");

                // Box
                _box
                    .style("background-color", _w.attr.backgroundColor);

                // Add content
                _content
                    .style("color", _w.attr.fontColor)
                    .html(_w.attr.content);

                // Show info
                _w.widget
                    .style("display", "block")
                    .transition().duration(400)
                    .style("opacity", 1);
            };
        }

        return _InfoBox;
    })();

    // Export
    InfoBox.prototype = Object.create(Widget.prototype);
    return InfoBox;
}));
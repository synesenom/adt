/**
 * Module implementing the picture widget.
 *
 * The picture widget is just simply a static image.
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
 * @module picture
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.widgets.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widgets'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'widgets', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Picture = factory(global.d3, global.du.widgets.Widget, global);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The picture widget class.
     *
     * @class Picture
     * @memberOf du.widgets.picture
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Picture(name, parent) {
        var _w = Widget.call(this, name, "picture", "div", parent);

        /**
         * Sets the image source path.
         *
         * @method src
         * @methodOf du.widgets.picture.Image
         * @param {string} path Path to the image source.
         */
        _w.attr.add(this, "src", "");

        // Widget elements
        var _svg = {};
        var _img = null;

        _w.render.build = function() {
            // Add widget
            _svg.g = _w.widget.append("div")
                .style("width", _w.attr.width > 0 ? _w.attr.width : null)
                .style("height", _w.attr.height > 0 ? _w.attr.height : null)
                .style("position", "relative")
                .style("pointer-events", "all");

            // Adjust aspect ratio and size once loaded
            _img = new Image();
            _img.onload = function() {
                var imgAspect = _img.width / _img.height;
                var aspect = _w.attr.width / _w.attr.height;
                var width = imgAspect > aspect ? _w.attr.width : _w.attr.height * imgAspect;
                var height = imgAspect < aspect ? _w.attr.height : _w.attr.width / imgAspect;

                _svg.g
                    .style("background-image", "url(" + _w.attr.src + ")")
                    .style("background-repeat", "none")
                    .style("background-size", width + "px " + height + "px")
                    .style("width", width + "px")
                    .style("height", height + "px")
                    .style("margin-left", (_w.attr.width - width) / 2 + "px")
                    .style("margin-top", (_w.attr.height - height) / 2 + "px")
                    .on("mouseover", function() {
                        _w.attr.mouseover && _w.attr.mouseover(_img);
                    })
                    .on("mouseleave", function() {
                        _w.attr.mouseleave && _w.attr.mouseleave(_img);
                    })
                    .on("click", function() {
                        _w.attr.click && _w.attr.click(_img);
                    });
            };
        };

        // Style updater
        _w.render.style = function() {
            // Set image source, it will update the widget as well
            if (_w.attr.src) {
                _img.src = _w.attr.src;
            }
        };
    }

    // Export
    Picture.prototype = Object.create(Widget.prototype);
    return Picture;
}));
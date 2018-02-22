/**
 * Module implementing a smart hint.
 *
 * A hint is a positioned label of information that disappears once the user interacts with the page.
 * It is always added to body as parent.
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
 * @module hint
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.widgets.Widget
 */
// TODO fix bug with disappearing hint when position is out of window
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widgets'), exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'widgets', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Hint = factory(global.d3, global.du.widgets.Widget, global);
    }
} (this, function (d3, Widget) {
    "use strict";

    /**
     * The hint widget class.
     *
     * @class Hint
     * @memberOf du.widgets.hint
     * @param {string} name Identifier of the widget.
     * @constructor
     */
    var Hint = (function () {
        /**
         * List of visible hints.
         *
         * @var {object} _hints
         * @memberOf du.widgets.hint.Hint
         * @private
         */
        var _hints = {};

        /**
         * Clears hints list.
         *
         * @method _clear
         * @memberOf du.widgets.hint.Hint
         * @private
         */
        function _clear() {
            for (var id in _hints) {
                if (_hints.hasOwnProperty(id)) {
                    delete _hints[id];
                }
            }
            _hints = {};
        }

        /**
         * The actual hint class.
         *
         * @class _Hint
         * @memberOf du.widgets.hint.Hint
         * @param {string} name Name of the hint.
         * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
         * @private
         */
        function _Hint(name, parent) {
            // Hint IDs
            var _idBase = "du-widgets-hint-";
            var _id = _idBase + name;
            var _styleId = _idBase + "css";
            var _class = _idBase + "class";

            // Avoid duplicates
            if (_hints.hasOwnProperty(_id)) {
                return _hints[_id];
            } else {
                var _w = Widget.call(this, name, "hint", "div", parent);
                var that = this;
            }

            /**
             * @property {string} text The hint text.
             * @memberOf du.widgets.hint.Hint
             */
            _w.attr.add(this, "text", "");

            /**
             * Pins the hint to the DOM so that it does not disappear on mousemove.
             *
             * @method pin
             * @memberOf du.widgets.hint.Hint
             * @param {boolean} pinned Whether the hint should be pinned.
             */
            _w.attr.add(this, "pin", false);

            // Add missing CSS for hint
            try {
                if (d3.select("#" + _styleId).empty()) {
                    d3.select("head").append("style")
                        .attr("id", _styleId)
                        .text("." + _class + ":after{content:' ';position:absolute;width:0;height:0;left:20.5px;bottom:-10px;border:7px solid;border-color:#000 transparent transparent #000;}");
                }

                // Setup mouse interaction
                window.addEventListener("mousemove", function () {
                    d3.selectAll("." + _class + ".removable").remove();
                    _clear();
                });
            } catch (e) {
                console.error("MissingDOMException: there is no DOM, could not add widget");
            }

            // Rendering methods.
            _w.render.build = function () {
                // Add hint class
                _w.widget.attr("class", _class)
                    .style("position", "absolute")
                    .style("display", "block")
                    .style("padding", "15px")
                    .style("text-align", "center")
                    .style("line-height", "1.1em")
                    .style("background-color", "black")
                    .style("border-radius", "4px")
                    .style("color", "white")
                    .style("font-size", "0.9em")
                    .style("font-weight", "bold")
                    .style("pointer-events", "none");
                if (!_w.attr.pin) {
                    _w.widget.classed("removable", true);
                }
            };

            _w.render.style = function (duration) {
                _w.widget
                    .style("width", "auto")
                    .style("height", null)
                    .html(_w.attr.text);

                // Show animation if first time created
                if (!_hints[_id]) {
                    _w.widget
                        .style("opacity", 0)
                        .transition().duration(duration)
                        .style("opacity", 1);

                    if (!_w.attr.pin) {
                        _hints[_id] = that;
                    }
                }
            };
        }

        return _Hint;
    })();

    // Export
    Hint.prototype = Object.create(Widget.prototype);
    return Hint;
}));
/**
 * Module for logging operations.
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
 * @module system.log
 * @memberOf du
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.system = global.du.system || {};
        global.du.system.log = factory();
    }
} (this, function () {
    "use strict";

    /**
     * Valid severity levels.
     *
     * @var {object} _SEVERITY
     * @memberOf du.system.log
     * @private
     */
    var _SEVERITY = {
        error: 'error',
        e: 'error',
        warning: 'warning',
        w: 'warning',
        info: 'info',
        i: 'info',
        debug: 'debug',
        d: 'debug'
    };

    /**
     * Current severity level.
     *
     * @var {string} _severity
     * @memberOf du.system.log
     * @private
     */
    var _severity = 'info';

    /**
     * Starting time of the logging.
     *
     * @var {Date} _start
     * @memberOf du.system.log
     * @private
     */
    var _start = new Date();

    /**
     * Convert a number to a zero padded string.
     *
     * @method _format
     * @memberOf du.system.log
     * @param {number} x Number to format.
     * @param {number} length Final length after zeroes added.
     * @returns {string} Zero padded number in string format.
     * @private
     */
    function _format(x, length) {
        return new Array(length - ("" + x).length + 1).join('0') + x;
    }

    /**
     * Returns the elapsed time in hh:mm:ss:ms format.
     *
     * @method _timer
     * @memberOf du.system.log
     * @returns {string} Elapsed time in string format.
     * @private
     */
    function _timer() {
        var ms = new Date() - _start;
        return _format(Math.floor(ms / 3600000), 2) + ":"
            + _format(Math.floor((ms % 3600000) / 60000), 2) + ":"
            + _format(Math.floor((ms % 60000) / 1000), 2)
            + "." + _format(ms % 1000, 3);
    }

    /**
     * Sets severity level for the logger.
     * Available severity levels (in increasing severity order): debug, info, warning and error.
     * Either the full name or the initial of the level is passed.
     *
     * @method severity
     * @memberOf du.system.log
     * @param {string} level Severity level to set logger to.
     */
    function severity(level) {
        if (_SEVERITY.hasOwnProperty(level.toLowerCase())) {
            _severity = level;
        }
    }

    /**
     * Prints a debug message on the console if severity level is at least 'debug'.
     *
     * @method d
     * @memberOf du.system.log
     * @param tag Tag to use for the log.
     * @param message Log message.
     */
    function d(tag, message) {
        if (_severity === 'debug')
            console.debug('DEBUG [' + _timer() + '] ' + tag + ': ' + message);
    }

    /**
     * Prints an info message on console if severity level is at least 'info'.
     *
     * @method i
     * @memberOf du.system.log
     * @param {string} tag Tag to use for the log.
     * @param {string} message Log message.
     */
    function i(tag, message) {
        if (_severity === 'info'
            || _severity === 'debug')
            console.info('INFO  [' + _timer() + '] ' + tag + ': ' + message);
    }

    /**
     * Prints a warning message to console if severity level is at least 'warning'.
     *
     * @method w
     * @memberOf du.system.log
     * @param {string} tag Tag to use for the log.
     * @param {string} message Log message.
     */
    function w(tag, message) {
        if (_severity === 'warning'
            || _severity === 'info'
            || _severity === 'debug')
            console.warn('WARN  [' + _timer() + '] ' + tag + ': ' + message);
    }

    /**
     * Prints an error message to console if severity level is at least 'error'.
     *
     * @method e
     * @memberOf du.system.log
     * @param {string} tag Tag to use for the log.
     * @param {string} message Log message.
     */
    function e(tag, message) {
        if (_severity === 'error'
            || _severity === 'warning'
            || _severity === 'info'
            || _severity === 'debug')
            console.error('ERROR [' + _timer() + '] ' + tag + ': ' + message);
    }

    // Exports
    return {
        severity: severity,
        d: d,
        i: i,
        w: w,
        e: e
    };
}));
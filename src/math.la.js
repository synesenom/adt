/**
 * Module containing various linear algebra structures and methods.
 *
 * @author Enys Mones
 * @module math.la
 * @memberOf du
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.math = global.du.math || {};
        global.du.math.la = factory();
    }
} (this, function () {
    "use strict";

    /**
     * Class representing an immutable 2D vector.
     *
     * @class Vector2
     * @memberOf du.math.la
     * @param {Array} coords Vector coordinates.
     * @constructor
     */
    var Vector2 = function (coords) {
        var _v = coords || [1, 0];

        /**
         * Returns the X component.
         *
         * @method x
         * @methodOf du.math.la.Vector2
         * @returns {number} The X component of the vector.
         */
        this.x = function () {
            return _v[0];
        };

        /**
         * Returns the Y component.
         *
         * @method y
         * @methodOf du.math.la.Vector2
         * @returns {number} The Y component of the vector.
         */
        this.y = function () {
            return _v[1];
        };

        /**
         * Sets or returns the length of the vector.
         *
         * @method length
         * @methodOf du.math.la.Vector2
         * @param {number} len Length to set. If not specified, current length is returned.
         * @returns {(number|du.math.la.Vector2)} A new vector with the specified length if length is set, current
         * length otherwise.
         */
        this.length = function (len) {
            var r = Math.sqrt(_v[0] * _v[0] + _v[1] * _v[1]);
            if (typeof len === "number") {
                var l = len / r;
                return new Vector2(_v.map(function (x) {
                    return x * l;
                }));
            }
            return r;
        };

        /**
         * Sets or returns the angle of the vector in radians.
         *
         * @method angle
         * @methodOf du.math.la.Vector2
         * @param {number} ang Angle to set in radians. If not specified, current angle is returned.
         * @returns {(number|du.math.la.Vector2)} A new vector with the specified angle if angle is set, current angle
         * otherwise.
         */
        this.angle = function (ang) {
            var a = Math.atan2(_v[1], _v[0]);
            if (typeof ang === "number") {
                var len = Math.sqrt(_v[0] * _v[0] + _v[1] * _v[1]);
                return new Vector2([len * Math.cos(ang), len * Math.sin(ang)]);
            }
            return a;
        };

        /**
         * Returns the array representation of the vector.
         *
         * @method toArray
         * @methodOf du.math.la.Vector2
         * @returns {Array} Array containing the X and coordinates.
         */
        this.toArray = function () {
            return [_v[0], _v[1]];
        };

        /**
         * Maps the vector using the specified function.
         *
         * @method map
         * @methodOf du.math.la.Vector2
         * @param {function} func Function to call on the vector. Must accept an array of 2 elements.
         * @returns {du.math.la.Vector2} The mapped vector.
         */
        this.map = function (func) {
            return new Vector2(func(_v));
        };

        /**
         * Adds another vector to this vector and returns the result vector.
         * This vector remains unchanged.
         *
         * @method add
         * @methodOf du.math.la.Vector2
         * @param {du.math.la.Vector2} v Vector to add to current one.
         * @returns {du.math.la.Vector2} The result vector.
         */
        this.add = function (v) {
            return new Vector2([_v[0] + v.x(), _v[1] + v.y()]);
        };

        /**
         * Subtracts another vector from this vector and returns the result vector.
         * This vector remains unchanged.
         *
         * @method sub
         * @methodOf du.math.la.Vector2
         * @param {du.math.la.Vector2} v Vector to subtract from current one.
         * @returns {du.math.la.Vector2} The result vector.
         */
        this.sub = function (v) {
            return new Vector2([_v[0] - v.x(), _v[1] - v.y()]);
        };

        /**
         * Multiplies this vector with a scalar and returns the result vector.
         * This vector remains unchanged.
         *
         * @method multiply
         * @methodOf du.math.la.Vector2
         * @param {number} s Scalar to multiply current vector with.
         * @returns {du.math.la.Vector2} The result vector.
         */
        this.multiply = function (s) {
            return new Vector2(_v.map(function (x) {
                return x * s;
            }));
        };
    };

    /**
     * Class representing a 3D vector.
     *
     * @class Vector3
     * @memberOf du.math.la
     * @param {Array} coords Vector coordinates.
     * @constructor
     */
    var Vector3 = function (coords) {
        var _v = coords || [1, 0, 0];

        /**
         * Returns the X component.
         *
         * @method x
         * @methodOf du.math.la.Vector3
         * @returns {number} The X component of the vector.
         */
        this.x = function () {
            return _v[0];
        };

        /**
         * Returns the Y component.
         *
         * @method y
         * @methodOf du.math.la.Vector3
         * @returns {number} The Y component of the vector.
         */
        this.y = function () {
            return _v[1];
        };

        /**
         * Returns the Z component.
         *
         * @method z
         * @methodOf du.math.la.Vector3
         * @returns {number} The Z component of the vector.
         */
        this.z = function () {
            return _v[2];
        };

        /**
         * Sets or returns the length of the vector.
         *
         * @method length
         * @methodOf du.math.la.Vector3
         * @param {number} len Length to set. If not specified, current length is returned.
         * @returns {(number|du.math.la.Vector3)} A new vector with the specified length if length is set, current
         * length otherwise.
         */
        this.length = function (len) {
            var r = Math.sqrt(_v[0] * _v[0] + _v[1] * _v[1] + _v[2] * _v[2]);
            if (typeof len === "number") {
                return new Vector3(_v.map(function (x) {
                    return x * len / r;
                }));
            }
            return r;
        };

        /**
         * Returns the latitude/longitude representation of the vector.
         *
         * @method toLatLon
         * @methodOf du.math.la.Vector3
         * @returns {du.math.la.LatLon} The corresponding LatLon object.
         */
        this.toLatLon = function () {
            var r = Math.sqrt(_v[0] * _v[0] + _v[1] * _v[1] + _v[2] * _v[2]);
            return new LatLon([Math.asin(_v[2] / r), Math.atan2(_v[1], _v[0])].map(function (x) {
                return x * 180 / Math.PI;
            }));
        };

        /**
         * Adds another vector to this vector and returns the result vector.
         * This vector remains unchanged.
         *
         * @method add
         * @methodOf du.math.la.Vector3
         * @param {du.math.la.Vector3} v Vector to add to current one.
         * @returns {du.math.la.Vector3} The result vector.
         */
        this.add = function (v) {
            return new Vector3([_v[0] + v.x(), _v[1] + v.y(), _v[2] + v.z()]);
        };

        /**
         * Multiplies this vector with a scalar and returns the result vector.
         * This vector remains unchanged.
         *
         * @method multiply
         * @methodOf du.math.la.Vector3
         * @param {number} s Scalar to multiply current vector with.
         * @returns {du.math.la.Vector3} The result vector.
         */
        this.multiply = function (s) {
            return new Vector3(_v.map(function (x) {
                return x * s;
            }));
        };

        /**
         * Returns the dot product with another vector.
         * The vector remains unchanged.
         *
         * @method dot
         * @methodOf du.math.la.Vector3
         * @param {du.math.la.Vector3} v Vector to multiply this vector with.
         * @returns {number} The dot product of the two vectors.
         */
        this.dot = function (v) {
            return _v[0] * v.x() + _v[1] * v.y() + _v[2] * v.z();
        };

        /**
         * Returns the cross product with another vector.
         * The vector remains unchanged.
         *
         * @method cross
         * @methodOf du.math.la.Vector3
         * @param {du.math.la.Vector3} v Vector to multiply this vector with.
         * @returns {du.math.la.Vector3} The result vector.
         */
        this.cross = function (v) {
            return new Vector3([
                _v[1] * v.z() - _v[2] * v.y(),
                _v[2] * v.x() - _v[0] * v.z(),
                _v[0] * v.y() - _v[1] * v.x()
            ]);
        };
    };

    /**
     * Class representing a latitude/longitude pair.
     *
     * @class LatLon
     * @memberOf du.math.la
     * @param {Array} latLon Array containing latitude and longitude.
     * @constructor
     */
    var LatLon = function (latLon) {
        var _ll = latLon || [0, 0];

        /**
         * Returns the array representation of the geolocation.
         *
         * @method toArray
         * @memberOf du.math.la.LatLon
         * @returns {Array} Latitude/longitude in an array.
         */
        this.toArray = function () {
            return [_ll[0], _ll[1]];
        };

        /**
         * Returns the Cartesian {du.math.la.Vector3} representation of the geolocation with unit radius.
         *
         * @method toVec
         * @memberOf du.math.la.LatLon
         * @returns {du.math.la.Vector3} Vector3 representation of the geolocation with unit radius.
         */
        this.toVec = function () {
            var la = _ll[0] * Math.PI / 180,
                lo = _ll[1] * Math.PI / 180;
            var c = Math.cos(la);
            return new la.Vector3([c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)]);
        };
    };

    // Export
    return {
        Vector2: Vector2,
        Vector3: Vector3,
        LatLon: LatLon
    };
}));
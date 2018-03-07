/**
 * Module implementing an interactive world map.
 *
 * The map widget is an interactive world map with all countries, dependent territories and special areas of
 * geographical interest. All separate areas that have their own ISO 3166-1 numeric-3 code are included extended by
 * Kosovo, Northern Cyprus and Somaliland. Therefore, the notion 'country' always refers to a region with their own
 * ISO 3166-1 numeric-3 code.
 * <br><br>Some of the built-in features:
 * <ul>
 *     <li>Zoom: clicking on country zooms in the map, clicking on water zooms out. Scrolling on the map
 *     enables zoom in/out.
 *     <li>Attach callbacks on country/territory hover/leave/click.
 *     <li>Simply decide if a geo location is within a country or not.
 *     <li>Add multiple static layers, draw on or highlight any of them.
 *     <li>Add multiple dynamic layers with animated dots.
 *     <li>Pass a list of clusterings to the map and highlight any of them.
 * </ul>
 * Additionally, you only need to work in geo locations, all transformations and projections are cared for under the
 * hood.
 * Note that the module already contains the paths for the countries as well as additional country data (capital info,
 * population size), which results in a significantly large size even minified (~730 kB).
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
 * @module map
 * @memberOf du.widgets
 * @requires lodash@4.17.4
 * @requires d3@v4
 * @requires topojson@v1
 * @requires du.widgets.Widget
 */
// TODO add country name in center of largest land
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('lodash'), require('topojson'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', '_', 'topojson', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.Map = factory(global.d3, global._, global.topojson, global.du.widgets.Widget);
    }
} (this, function (d3, _, topojson, Widget) {
    "use strict";

    /**
     * The map widget class.
     *
     * @class Map
     * @memberOf du.widgets.map
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     */
    function Map(name, parent) {
        var _id = "du-widgets-map";
        var _w = Widget.call(this, name, "map", "div", parent);

        /**
         * Sets horizontal position of the map center relative to the widget's center.
         * Default is 0.
         *
         * @method centerX
         * @memberOf du.widgets.map.Map
         * @param {number} dx Horizontal distance to set.
         */
        _w.attr.add(this, "centerX", 0);

        /**
         * Sets vertical position of the map center relative to the widget's center.
         * Default is 0.
         *
         * @method centerY
         * @memberOf du.widgets.map.Map
         * @param {number} dy Vertical distance to set.
         */
        _w.attr.add(this, "centerY", 0);

        /**
         * Sets color of the background (water).
         * Default is white.
         *
         * @method backgroundColor
         * @memberOf du.widgets.map.Map
         * @param {string} color Background color.
         */
        _w.attr.add(this, "backgroundColor", "white");

        /**
         * Sets color of the foreground (soil).
         * Default is black.
         *
         * @method foregroundColor
         * @memberOf du.widgets.map.Map
         * @param {string} color Foreground color.
         */
        _w.attr.add(this, "foregroundColor", "black");

        /**
         * Sets color of the borders.
         * Default is white.
         *
         * @method borderColor
         * @memberOf du.widgets.map.Map
         * @param {string} color Border color.
         */
        _w.attr.add(this, "borderColor", "white");

        /**
         * Sets callback for click on water.
         * Can accept one parameter denoting if a zoom out was performed.
         *
         * @method outClick
         * @memberOf du.widgets.map.Map
         * @param {function} callback Callback to set.
         */
        _w.attr.add(this, "outClick", null);

        /**
         * Displays labels on the map when zoomed.
         *
         * @method labels
         * @memberOf du.widgets.map.Map
         * @param {boolean} on Whether to enable labels or not.
         */
        _w.attr.add(this, "labels", false);

        /**
         * Namespace containing various country related methods.
         *
         * @namespace countries
         * @memberOf du.widgets.map.Map
         */
        var _countries = (function() {
            var _paths = null;
            var _info = null;
            var _ids = null;
            function _load(filename) {
                d3.json(filename, function (data) {
                    /**
                     * Country paths.
                     *
                     * @var {object} _paths
                     * @memberOf du.widgets.map.Map.countries
                     * @private
                     */
                    _paths = topojson.feature(data.paths, data.paths['objects']['countries']).features;
                    _paths.filter(function (d) {
                        return data.info.some(function (n) {
                            if (d.id === n.id)
                                return d.name = n.name;
                        });
                    }).sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });

                    /**
                     * Country info.
                     *
                     * @var {object} _info
                     * @memberOf du.widgets.map.Map.countries
                     * @private
                     */
                    _info = d3.map();
                    data.info.forEach(function (d) {
                        _info.set(d.name, {
                            name: d.name,
                            capital: d.capital,
                            population: d.population
                        });
                    });

                    /**
                     * Country IDs.
                     *
                     * @var {object} _ids
                     * @memberOf du.widgets.map.Map.countries
                     * @private
                     */
                    _ids = d3.map();
                    _paths.forEach(function (path, i) {
                        _ids.set(path.name, i);
                    });

                    _w.render.build();
                    _w.render.update();
                    _w.render.style();
                });
            }

            /**
             * Returns country ID from its name.
             *
             * @method _getId
             * @memberOf du.widgets.map.Map.countries
             * @param {string} country Country name.
             * @returns {?number} ID of the country if exists, null otherwise.
             * @private
             */
            function _getId(country) {
                return _ids.has(country) ? _ids.get(country) : null;
            }

            /**
             * Returns an array containing {id: number, name: string} objects of the country ids and names in the
             * map.
             *
             * @method get
             * @memberOf du.widgets.map.Map.countries
             * @returns {Array}
             */
            function get() {
                return _paths.map(function(d){
                    return {
                        id: d.id,
                        name: d.name
                    };
                });
            }

            /**
             * Returns the capital of a country or all countries.
             * If country is passed and is valid, an object {name: string, lon: number, lat: number} is returned with
             * with the name and geo coordinates of the capital. Otherwise, an array containing the capitals in the
             * above format is returned.
             * Note that some capitals and geo coordinates can be null.
             *
             * @method capital
             * @memberOf du.widgets.map.Map.countries
             * @param {string} country Name of the country to return capital data for.
             * @returns {(object|Array)} Object or array of objects containing the capital data.
             */
            function capital(country) {
                return (country && _info.has(country))
                    ? _info.get(country).capital
                    : _info.values().map(function(d){return {name: d.name, capital: d.capital} });
            }

            /**
             * Returns the population of a country or all countries.
             * If country is passed and is valid, the population is returned, otherwise an array containing
             * {name: string, population: number} objects is returned containing all population data.
             * Source: CIA World Factbook (2017)
             *
             * @method population
             * @memberOf du.widgets.map.Map.countries
             * @param {string} country Name of the country to return population data for.
             * @returns {(number|Array)} Population or array of population data.
             */
            function population(country) {
                return (country && _info.has(country))
                    ? _info.get(country).population
                    : _info.values().map(function(d){return {name: d.name, population: d.population} });
            }

            /**
             * Checks if a point is inside a polygon using ray-casting.
             * Source: http://bl.ocks.org/bycoffe/5575904
             *
             * @method _pointInPolygon
             * @memberOf du.widgets.map.Map.countries
             * @param {Array} point Array containing the X and Y coordinates of the point.
             * @param {Array} polygon Array containing the array of coordinates for the polygon corners.
             * @return {boolean} True if point is inside polygon, false otherwise.
             * @private
             */
            function _pointInPolygon(point, polygon) {
                var xi, xj, yi, yj, intersect,
                    x = point[0],
                    y = point[1],
                    inside = false;
                for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    xi = polygon[i][0];
                    yi = polygon[i][1];
                    xj = polygon[j][0];
                    yj = polygon[j][1];
                    intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            }

            /**
             * Checks if a geo location is inside a country.
             *
             * @method containsGeoLoc
             * @memberOf du.widgets.map.Map.countries
             * @param {string} country Name of the country to check boundaries against.
             * @param {Array} latLon Two element array containing the latitude and longitude of the point.
             * @returns {boolean} True if point is inside the country, false otherwise.
             */
            function containsGeoLoc(country, latLon) {
                var id = _countries._id(country);
                if (id) {
                    var mapCoordinates = _mapLayer._project(latLon);
                    var areas = _countries._paths()[id].svg.areas;
                    for (var k = 0; k < areas.length; k++) {
                        if (_pointInPolygon(mapCoordinates, areas[k])) {
                            return true;
                        }
                    }
                }
                return false;
            }

            // Exposed members/methods
            return {
                _load: _load,
                _paths: function() {return _paths; },
                _id: _getId,
                get: get,
                capital: capital,
                population: population,
                containsGeoLoc: containsGeoLoc
            };
        })();

        // Public methods
        this.countries = {
            get: _countries.get,
            capital: _countries.capital,
            population: _countries.population,
            containsGeoLoc: _countries.containsGeoLoc
        };

        /**
         * Sets the map resource to the specified URL.
         * At the moment the only supported resource is the {world.json} file that is available at
         * {https://synesenom.github.io/dashboard-utils/dl/maps/world.json}.
         *
         * @method resource
         * @memberOf du.widgets.map.Map
         * @param {string} url URL to use for the map.
         * @returns {du.widgets.map.Map}
         */
        this.resource = function(url) {
            _countries._load(url);
            return this;
        };

        /**
         * Namespace containing various clustering related methods.
         *
         * @namespace clustering
         * @memberOf du.widgets.map.Map
         */
        var _clustering = (function() {
            /**
             * The list of groups.
             *
             * @var {object} _groupLists
             * @memberOf du.widgets.map.Map.clustering
             * @private
             */
            var _clusterings = {};

            /**
             * Returns the ID selector to a clustering and a group. This can be passed to methods that require a
             * group selector.
             *
             * @method selector
             * @memberOf du.widgets.map.Map.clustering
             * @param {string} id Identifier of the clustering.
             * @param {string} name Name of the group.
             * @returns {string} Selector representing the clustering and group name.
             */
            function selector(id, name) {
                return _w.utils.encode(id) + "__" + _w.utils.encode(name);
            }

            /**
             * Returns an array of clustering group IDs or existing clustering IDs.
             *
             * @method get
             * @memberOf du.widgets.map.Map.clustering
             * @param {string} id Identifier of clustering. If invalid or not specified, the list of clustering IDs is
             * returned.
             * @returns {Array} Array of existing clustering IDs.
             */
            function get(id) {
                if (id && _clusterings.hasOwnProperty(id)) {
                    return Object.keys(_clusterings[id]);
                } else {
                    return Object.keys(_clusterings);
                }
            }

            /**
             * Adds a new clustering.
             *
             * @method add
             * @memberOf du.widgets.map.Map.clustering
             * @param {string} id Identifier of the clustering to add.
             * @param {object} groups Object containing the key as the name of the group and value as array of
             * countries.
             * @returns {boolean} True if clustering doesn't exist and could be added, false otherwise.
             */
            function add(id, groups) {
                if (!_clusterings.hasOwnProperty(id)) {
                    _clusterings[id] = groups;
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Removes a clustering.
             *
             * @method remove
             * @memberOf du.widgets.map.Map.clustering
             * @param {string} id Identifier of the clustering to remove.
             * @returns {boolean} True if clustering exists and could be removed, false otherwise.
             */
            function remove(id) {
                if (_clusterings.hasOwnProperty(id)) {
                    _.forOwn(_clusterings[id], function(group, name) {
                        var groupId = selector(id, name);
                        group.forEach(function(member) {
                            if (typeof _countries._id(member) === "number") {
                                _mapLayer._select(member)
                                    .classed(groupId, false);
                            }
                        });
                    });
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Marks countries according to the clusterings.
             *
             * @method _mark
             * @memberOf du.widgets.map.Map.clustering
             * @private
             */
            function _mark() {
                _.forOwn(_clusterings, function(list, id) {
                    _.forOwn(list, function(group, name) {
                        var groupId = selector(id, name);
                        group.forEach(function(member) {
                            if (typeof _countries._id(member) === "number") {
                                _mapLayer._select(member)
                                    .classed(groupId, true);
                            }
                        });
                    });
                });
            }

            // Exposed methods
            return {
                get: get,
                add: add,
                remove: remove,
                selector: selector,
                _mark: _mark
            };
        })();

        // Public methods
        this.clustering = {
            get: _clustering.get,
            add: _clustering.add,
            remove: _clustering.remove,
            selector: _clustering.selector
        };

        /**
         * Namespace responsible for all zoom operations.
         *
         * @namespace _zoom
         * @memberOf du.widgets.map.Map
         * @private
         */
        var _zoom = (function() {
            /**
             * Zoom max scale level.
             *
             * @var {number} _SCALE_MAX
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _SCALE_MAX = 128;

            /**
             * Zoom translate boundary factor. This is the extent we allow translations outside the map.
             *
             * @var {number} _TRANSLATE_BOUND_FACTOR
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _TRANSLATE_BOUND_FACTOR = 0.3;

            /**
             * Layers that are affected by the zoom.
             *
             * @var {object} _layers
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _layers = {};

            /**
             * Current transformation.
             *
             * @var {object} _transform
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _transform = d3.zoomIdentity;

            /**
             * Current zoom level.
             *
             * @var {number} _level
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _level = 1;

            /**
             * The zoom object.
             *
             * @var {object} _zoom
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            var _zoom = d3.zoom()
                .scaleExtent([1, _SCALE_MAX])
                .on("zoom", _zoomed);

            /**
             * Transforms a point according to the current zoom.
             *
             * @method transform
             * @memberOf du.widgets.map.Map._zoom
             * @param {Array} point Array of x and y values to transform.
             * @returns {Array} The transformed point.
             */
            function transform(point) {
                return _transform.apply(point);
            }

            /**
             * Inverts a point according to the current zoom.
             *
             * @method invert
             * @memberOf du.widgets.map.Map._zoom
             * @param {Array} point Array of x and y values to invert.
             * @returns {Array} The inverted point.
             */
            function invert(point) {
                return _transform.invert(point);
            }

            /**
             * Returns the current zoom level.
             *
             * @method level
             * @memberOf du.widgets.map.Map._zoom
             * @returns {number} Zoom level.
             */
            function level() {
                return _level;
            }

            /**
             * Initializes zoom boundary.
             *
             * @method init
             * @memberOf du.widgets.map.Map._zoom
             */
            function init() {
                _zoom.translateExtent([[-_TRANSLATE_BOUND_FACTOR*_w.attr.width, -_TRANSLATE_BOUND_FACTOR*_w.attr.height],
                    [(1+_TRANSLATE_BOUND_FACTOR)*_w.attr.width, (1+_TRANSLATE_BOUND_FACTOR)*_w.attr.height]]);
            }

            /**
             * Sets a layer to the specified selection.
             *
             * @method setLayer
             * @memberOf du.widgets.map.Map._zoom
             * @param {string} name Name of the layer to set.
             * @param {object} layer Selection to set to layer.
             */
            function setLayer(name, layer) {
                _layers[name] = layer;
            }

            /**
             * Performs the zoom on all available layers.
             *
             * @method _zoomed
             * @memberOf du.widgets.map.Map._zoom
             * @private
             */
            function _zoomed() {
                var k = d3.event.transform.k;

                // Zoom map
                _layers.map.paths.style("stroke-width", 0.5 / k + "px");
                _layers.map.paths.attr("transform", d3.event.transform);
                if (_layers.map.labels) {
                    _layers.map.labels
                        .style("opacity", k > 3 ? Math.pow(k, 4) / 1000 : 0)
                        .attr("font-size", 10 / k + "pt")
                        .attr("dy", 5 / k + "pt")
                        .attr("transform", d3.event.transform);
                }

                // Zoom static layer
                _staticLayer._clear();
                _.forOwn(_layers.static, function(layer) {
                    layer.canvas.translate(d3.event.transform.x, d3.event.transform.y);
                    layer.canvas.scale(d3.event.transform.k, d3.event.transform.k);
                });
                _staticLayer._render(d3.event.transform.k);
                _staticLayer._restore();

                // Zoom dynamic layer
                _.forOwn(_layers.dynamic, function(layer) {
                    layer.g.attr("transform", d3.event.transform);
                });

                // Zoom touch layer
                _layers.touch.attr("transform", d3.event.transform);

                // Save last transform
                if (d3.event && d3.event.transform) {
                    _transform = d3.zoomIdentity
                        .translate(d3.event.transform.x, d3.event.transform.y)
                        .scale(d3.event.transform.k);
                    _level = d3.event.transform.k;
                }
            }

            /**
             * Resets zoom to identity.
             *
             * @method reset
             * @memberOf du.widgets.map.Map._zoom
             */
            function reset() {
                // Zoom map
                _layers.map.svg.transition().duration(1000)
                    .call(_zoom.transform, d3.zoomIdentity);
            }

            /**
             * Performs zoom when clicked on a country.
             *
             * @method clicked
             * @memberOf du.widgets.map.Map._zoom
             * @param {Array} bounds Country boundaries.
             */
            function click(bounds) {
                // Get zoom parameters
                var dx = bounds[1][0] - bounds[0][0],
                    dy = bounds[1][1] - bounds[0][1],
                    x = (bounds[0][0] + bounds[1][0]) / 2,
                    y = (bounds[0][1] + bounds[1][1]) / 2,
                    scale = Math.max(1, Math.min(_SCALE_MAX, 0.8 / Math.max(dx / _w.attr.width, dy / _w.attr.height))),
                    translate = [_w.attr.width / 2 - scale * x, _w.attr.height / 2 - scale * y];

                // Zoom map
                _layers.map.svg.transition().duration(1000)
                    .call(_zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
            }

            // Public methods
            return {
                init: init,
                setLayer: setLayer,
                zoom: _zoom,
                reset: reset,
                click: click,
                transform: transform,
                invert: invert,
                level: level
            };
        })();

        /**
         * Map layer: draws countries.
         *
         * @namespace _mapLayer
         * @memberOf du.widgets.map.Map
         * @private
         */
        var _mapLayer = (function () {
            /**
             * The SVG element for the map (countries).
             *
             * @var {object} _svg
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _svg = _w.widget.append("svg")
                .attr("id", _id + "-map-layer")
                .style("position", "absolute")
                .call(_zoom.zoom);

            /**
             * The background of the map (water).
             *
             * @var {object} _background
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _background = _svg.append("rect")
                .attr("id", "water")
                .style("position", "absolute")
                .style("width", 0)
                .style("height", 0)
                .style("top", 0)
                .style("left", 0);

            /**
             * The container of the countries.
             *
             * @var {object} _land
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _land = _svg.append("g")
                .attr("id", "land");

            /**
             * Paths of the countries.
             *
             * @var {object} _paths
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _paths = null;
            function _build() {
                if (_countries._paths() === null) {
                    return;
                }
                _paths = _land.selectAll("path")
                    .data(_countries._paths())
                    .enter().append("path")
                    .attr("class", function (d) {
                        return "country-" + _countries._id(d.name);
                    })
                    .style("stroke-width", "0.5px")
                    .style("cursor", "pointer");
            }

            /**
             * Projection used for the map.
             *
             * @var {function} _projection
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _projection = d3.geoMercator()
                .precision(0.1);

            /**
             * Path projector function.
             *
             * @var {function} _pathFn
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _pathFn = d3.geoPath().projection(_projection);

            /**
             * Displayed country names.
             *
             * @var {object} _countryNames
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            var _pathLabels = null;

            /**
             * Projects (latitude, longitude) geo coordinates into an (x, y) point on the map.
             *
             * @method _project
             * @memberOf du.widgets.map.Map._mapLayer
             * @param {Array} latLon Array containing the latitude and longitude.
             * @returns {Array} Array containing the mapped (x, y) coordinates.
             * @private
             */
            function _project(latLon) {
                return _projection([latLon[1], latLon[0]]);
            }

            /**
             * Calculates country centers.
             *
             * @method _calculateCenters
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            function _calculateCenters() {
                _countries._paths().forEach(function(country) {
                    country.svg.center = _pathFn.centroid(country);
                    country.svg.realCenter = _getRealCenter(country);
                });
            }

            /**
             * Calculates country dimensions (bounding boxes).
             *
             * @method _calculateSizes
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            function _calculateSizes() {
                _countries._paths().forEach(function (country) {
                    var dx = [];
                    var dy = [];
                    var areas = country.geometry.coordinates;
                    if (areas.length === 1) {
                        areas[0].forEach(function (coordinates) {
                            var r = _projection(coordinates);
                            dx.push(Math.abs(r[0] - country.svg.center[0]));
                            dy.push(Math.abs(r[1] - country.svg.center[1]));
                        });
                    } else {
                        areas.forEach(function (area) {
                            area[0].forEach(function (coordinates) {
                                var r = _projection(coordinates);
                                dx.push(Math.abs(r[0] - country.svg.center[0]));
                                dy.push(Math.abs(r[1] - country.svg.center[1]));
                            });
                            if (area.length > 1) {
                                area.forEach(function (coordinates) {
                                    var r = _projection(coordinates);
                                    dx.push(Math.abs(r[0] - country.svg.center[0]));
                                    dy.push(Math.abs(r[1] - country.svg.center[1]));
                                });
                            }
                        });
                    }
                    country.svg.width = d3.max(dx) * 2;
                    country.svg.height = d3.max(dy) * 2;
                });
            }

            /**
             * Calculates country areas for ray-casting.
             *
             * @method _calculateAreas
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            function _calculateAreas() {
                _countries._paths().forEach(function(country) {
                    country.svg.areas = null;
                    if (country.geometry.coordinates.length === 1) {
                        // Single territories
                        var svgAreas = [];
                        country.geometry.coordinates[0].forEach(function (coordinates) {
                            svgAreas.push(_projection(coordinates));
                        });
                        country.svg.areas = [svgAreas];
                    } else {
                        country.svg.areas = [];
                        country.geometry.coordinates.forEach(function (coordinates) {
                            var area = [];
                            // South Africa, crazy borders...
                            if (coordinates.length > 1) {
                                coordinates.forEach(function (coordinates) {
                                    area.push(_projection(coordinates));
                                });
                            } else {
                                // Multiple territory countries
                                coordinates[0].forEach(function (coordinates) {
                                    area.push(_projection(coordinates));
                                });
                            }
                            country.svg.areas.push(area);
                        });
                    }
                });
            }

            /**
             * Returns the coordinates of the largest paths for a country.
             *
             * @method _getRealCenter
             * @memberOf du.widgets.map.Map._mapLayer
             * @param {object} country Country to calculate real center for.
             * @returns {Array} Array containing the x and y coordinates of the real center.
             * @private
             */
            function _getRealCenter(country) {
                if (country.geometry.coordinates.length === 1) {
                    return _pathFn.centroid(country);
                }
                else {
                    var region = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: country.geometry.coordinates[0]
                        }
                    };
                    for (var i = 1; i < country.geometry.coordinates.length; i++) {
                        var r = {
                            type: "Feature",
                            geometry: {
                                type: "Polygon",
                                coordinates: country.geometry.coordinates[i]
                            }
                        };
                        if (_pathFn.area(r) > _pathFn.area(region)) {
                            region = r;
                        }
                    }
                    var center = _pathFn.centroid(region);
                    if (isNaN(center[0]) || isNaN(center[1]))
                        return _pathFn.centroid(country);
                    else
                        return center;
                }
            }

            /**
             * Updates map data.
             *
             * @method _update
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            function _update() {
                if (_countries._paths() === null) {
                    return;
                }

                // Update projection and path function
                _projection
                    .scale(_w.attr.width / (2 * Math.PI))
                    .translate([_w.attr.width / 2 + _w.attr.centerX, _w.attr.height / 2 + _w.attr.centerY]);
                _pathFn = d3.geoPath().projection(_projection);

                // Update map related properties
                _countries._paths().forEach(function(country) {
                    country.svg = {};
                });
                _calculateCenters();
                _calculateSizes();
                _calculateAreas();
            }

            /**
             * Sets adjustable style properties.
             *
             * @method _style
             * @memberOf du.widgets.map.Map._mapLayer
             * @private
             */
            function _style() {
                if (_countries._paths() === null) {
                    return;
                }

                // Update map elements
                _svg
                    .attr("width", _w.attr.width + "px")
                    .attr("height", _w.attr.height + "px");
                _background
                    .style("width", "100%")
                    .style("height", "100%")
                    .style("fill", _w.attr.backgroundColor)
                    .on("click", function() {
                        // Zoom out
                        _zoom.reset();

                        // Remove focus
                        _paths
                            .classed("focus", false)
                            .style("fill", _w.attr.foregroundColor);

                        // Additional out click event
                        if (_w.attr.outClick)
                            _w.attr.outClick();
                    });
                _paths
                    .attr("d", _pathFn)
                    .style("fill", _w.attr.foregroundColor)
                    .style("stroke", _w.attr.borderColor)
                    .style("cursor", "pointer")
                    .on("mouseover", function (d, i) {
                        // Set color
                        d3.select(this).style("fill", d3.color(_w.attr.foregroundColor).brighter());

                        // Additional actions
                        if (_w.attr.mouseover)
                            _w.attr.mouseover(d.name, i);
                    })
                    .on("mouseleave", function (d, i) {
                        // Set color
                        var c = d3.select(this);
                        var color = d3.color(_w.attr.foregroundColor);
                        c.style("fill", c.classed("focus") ? color.brighter() : color);

                        // Additional actions
                        if (_w.attr.mouseleave)
                            _w.attr.mouseleave(d.name, i);
                    })
                    .on("click", function (d, i) {
                        // Check if country is already in focus
                        var c = d3.select(this);
                        var focused = c.classed("focus");

                        // Zoom in/out
                        if (focused)
                            _zoom.reset();
                        else {
                            _zoom.click(_pathFn.bounds(d));
                        }

                        // Set/remove focus
                        var color = d3.color(_w.attr.foregroundColor);
                        _paths
                            .classed("focus", function(dd) { return dd === d ? !focused : false; })
                            .style("fill", color);
                        c.style("fill", !focused ? color.brighter() : color);

                        // Additional actions
                        if (_w.attr.click)
                            _w.attr.click(d.name, i);
                    });

                // Add path names
                /*
                if (_w.attr.labels && _pathLabels === null) {
                    _pathLabels = _land.selectAll("text")
                        .data(_countries._paths)
                        .enter().append("text")
                        .style("fill", "#ddd")
                        .style("text-shadow", "0 0 1px black")
                        .attr("font-size", "10pt")
                        .attr("font-family", "'Montserrat', sans-serif")
                        .attr("text-anchor", "middle")
                        .attr("dy", "5pt")
                        .style("cursor", "pointer")
                        .style("opacity", 0)
                        .text(function(d) { return d.name; })
                        .attr("x", function (d) {
                            return d.svg.realCenter[0] + (_CENTER_CORRECTIONS[d.name] ? _CENTER_CORRECTIONS[d.name][0] : 0);
                        })
                        .attr("y", function (d) {
                            return d.svg.realCenter[1] + (_CENTER_CORRECTIONS[d.name] ? _CENTER_CORRECTIONS[d.name][1] : 0);
                        })
                        .on("click", function(d) {
                            // Check if country is already in focus
                            var c = d3.select(this);
                            var focused = c.classed("focus");

                            // Zoom in/out
                            if (focused)
                                _zoom.reset();
                            else {
                                _zoom.click(_pathFn.bounds(d));
                            }
                        });
                }*/

                // Set map layer for zoom
                _zoom.setLayer('map', {svg: _svg, paths: _paths, labels: _pathLabels});
            }

            /**
             * Selects a country or group of countries.
             *
             * @method _select
             * @memberOf du.widgets.map.Map._mapLayer
             * @param {string=} id ID of country or group to select. If not specified, all countries are selected.
             * @returns {object} D3 selection corresponding to the group.
             * @private
             */
            function _select(id) {
                if (typeof id === "string") {
                    return _countries._id(id)
                        ? _land.select("path.country-" + _countries._id(id))
                        : _land.selectAll("path." + _w.utils.encode(id));
                } else {
                    return _paths;
                }
            }

            function dim(level) {
                _paths.style("opacity", level ? level : 1);
            }

            /**
             * Highlights a single country or a group of countries.
             *
             * @method highlight
             * @memberOf du.widgets.map.Map
             * @param {?string=} id ID of a country or a group to highlight. If not specified, all countries are
             * highlighted.
             * @param {string=} color Optional color to use for highlight (default is the bright version of foreground).
             * @param {string=} duration Optional duration length in ms (default is 0).
             */
            function highlight(id, color, duration) {
                _select(id)
                    .transition().duration(duration ? duration : 0)
                    .style("fill", typeof color === "string" ? color
                        : (typeof id === "string") ? d3.color(_w.attr.foregroundColor).brighter() : _w.attr.foregroundColor);
            }

            // Exposed methods
            return {
                _select: _select,
                _project: _project,
                _build: _build,
                _update: _update,
                _style: _style,
                dim: dim,
                highlight: highlight
            };
        })();

        // Public methods
        this.dim = _mapLayer.dim;
        this.highlight = _mapLayer.highlight;

        /**
         * The static layers namespace.
         *
         * @namespace staticLayer
         * @memberOf du.widgets.map.Map
         */
        var _staticLayer = (function() {
            /**
             * Container of all static layers.
             *
             * @var {object} _container.
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            var _container = _w.widget.append("div")
                .attr("id", _id + "-static-layers")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("width", _w.attr.width + "px")
                .style("height", _w.attr.height + "px");

            /**
             * List of static layers.
             *
             * @var {object} _layers
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            var _layers = {};
            _zoom.setLayer('static', _layers);

            /**
             * Returns an array of existing static layers.
             *
             * @method get
             * @memberOf du.widgets.map.Map.staticLayer
             * @returns {Array} Array of existing static layer IDs.
             */
            function get() {
                return Object.keys(_layers);
            }

            /**
             * Adds a new static layer to the map if it there is no layer with the same ID already.
             *
             * @method add
             * @memberOf du.widgets.map.Map.staticLayer
             * @param {string} id Identifier of the new static layer.
             * @returns {boolean} True if new layer could be added, false otherwise.
             */
            function add(id) {
                var safeId = _w.utils.encode(id);
                if (!_layers.hasOwnProperty(safeId)) {
                    // Add static layer (canvas element)
                    _layers[safeId] = (function() {
                        // The canvas element of the layer.
                        var _g = _container.append("canvas")
                            .attr("id", _id + "-static-layer-" + safeId)
                            .attr("width", _w.attr.width + "px")
                            .attr("height", _w.attr.height + "px")
                            .style("position", "absolute")
                            .style("pointer-events", "none");

                        // The canvas to draw on.
                        var _canvas = _g.node().getContext("2d");

                        // The content of the layer.
                        var _content = [];

                        var append = {
                            dot: function(x, y, r, color) {
                                // Add dot
                                _content.push({
                                    type: "dot",
                                    x: x,
                                    y: y,
                                    r: r,
                                    color: color
                                });
                            }
                        };

                        // Rescales content when map dimensions have changed
                        function rescaleContent(scaleX, scaleY) {
                            _content.forEach(function(d) {
                                d.x = (d.x + _w.attr.centerX*(scaleX-1)) / scaleX;
                                d.y = (d.y + _w.attr.height*(scaleX-scaleY)/2 + _w.attr.centerY*(scaleX-1)) / scaleX;
                            });
                        }

                        // Clears content
                        function clearContent() {
                            _content = [];
                        }

                        // Draw namespace
                        var draw = {
                            dot: function(x, y, r, color, old) {
                                // Set color if specified
                                if (color)
                                    _canvas.fillStyle = color;

                                // Adjust radius and position
                                var adjustedR = r / (old ? Math.pow(_zoom.level(), 0.9) : 0.6);
                                var adjustedPos = !old
                                    ? _zoom.transform([x, y])
                                    : [x, y];

                                // Draw
                                _canvas.fillRect(adjustedPos[0] - adjustedR / 2, adjustedPos[1] - adjustedR / 2,
                                    adjustedR, adjustedR);
                            }
                        };

                        // Renders layer
                        function render() {
                            // Calculate bounding box
                            var topLeft = _zoom.invert([0, 0]);
                            var bottomRight = _zoom.invert([_w.attr.width, _w.attr.height]);
                            var boundingBox = {
                                xMin: topLeft[0],
                                xMax: bottomRight[0],
                                yMin: topLeft[1],
                                yMax: bottomRight[1]
                            };

                            // Go through color index lists (prevent multiple color setting)
                            _content.forEach(function (d) {
                                // If element is not visible, move on
                                if (d.x < boundingBox.xMin || d.x > boundingBox.xMax
                                    || d.y < boundingBox.yMin || d.y > boundingBox.yMax) {
                                    return;
                                }

                                // Finally, draw element
                                switch (d.type) {
                                    case "dot":
                                        draw.dot(d.x, d.y, d.r, d.color, true);
                                        break;
                                    default:
                                        break;
                                }
                            });
                        }

                        // Public members/methods
                        return {
                            g: _g,
                            canvas: _canvas,
                            draw: draw,
                            rescaleContent: rescaleContent,
                            clearContent: clearContent,
                            append: append,
                            render: render
                        };
                    })();
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Styles all static layers.
             *
             * @method _style
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            function _style() {
                // Get scale factors
                var scaleX = parseInt(_container.style("width")) / _w.attr.width;
                var scaleY = parseInt(_container.style("height")) / _w.attr.height;

                // Update container
                _container
                    .style("width", _w.attr.width + "px")
                    .style("height", _w.attr.height + "px");

                // Update layers
                _.forOwn(_layers, function(layer) {
                    layer.g
                        .attr("width", _w.attr.width + "px")
                        .attr("height", _w.attr.height + "px");
                    layer.rescaleContent(scaleX, scaleY);
                    layer.render();
                });
            }

            /**
             * Erases the content of a static layer.
             *
             * @method erase
             * @memberOf du.widgets.map.Map.staticLayer
             * @param {string} id Identifier of the layer to use.
             * @returns {boolean} True if layer exists and could be erased, false otherwise.
             */
            function erase(id) {
                var safeId = _w.utils.encode(id);
                if (_layers.hasOwnProperty(safeId)) {
                    _layers[safeId].canvas.clearRect(0, 0, _w.attr.width, _w.attr.height);
                    _layers[safeId].clearContent();
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Clears all layers.
             *
             * @method _clear
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            function _clear() {
                // Save and clear canvases
                _.forOwn(_layers, function(layer) {
                    layer.canvas.save();
                    layer.canvas.clearRect(0, 0, _w.attr.width, _w.attr.height);
                });
            }

            /**
             * Highlights a specific layer. If no layer is passed, removed highlight.
             *
             * @method highlight
             * @memberOf du.widgets.map.Map.staticLayer
             * @param {string} id Identifier of the static layer to highlight. If not given, highlight is cancelled.
             */
            function highlight(id) {
                var safeId = _w.utils.encode(id);
                if (safeId && _layers.hasOwnProperty(safeId)) {
                    _.forOwn(_layers, function(layer, name) {
                        layer.g
                            .transition().duration(100)
                            .style("opacity", safeId === name ? 1 : 0);
                    });
                } else {
                    _.forOwn(_layers, function(layer) {
                        layer.g
                            .transition().duration(100)
                            .style("opacity", 1);
                    });
                }
            }

            /**
             * Renders all layers.
             *
             * @method _render
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            function _render(scale) {
                _.forOwn(_layers, function(layer) {
                    layer.render(scale);
                });
            }

            /**
             * Restores canvas states.
             *
             * @method _restore
             * @memberOf du.widgets.map.Map.staticLayer
             * @private
             */
            function _restore() {
                _.forOwn(_layers, function(layer) {
                    layer.canvas.restore();
                });
            }

            /**
             * Namespace containing drawing functions.
             *
             * @namespace draw
             * @memberOf du.widgets.map.Map.staticLayer
             */
            var draw = {
                /**
                 * Adds a dot to the specified static layer.
                 *
                 * @method dot
                 * @memberOf du.widgets.map.Map.staticLayer.draw
                 * @param {string} id Identifier of the layer to use.
                 * @param {Array} latLon Array containing the latitude and longitude.
                 * @param {number} r Radius of the dot.
                 * @param {string} color Color of the dot.
                 * @returns {boolean} True if layer exists, coordinates are valid and dot could be added,
                 * false otherwise.
                 */
                dot: function(id, latLon, r, color) {
                    // Check geo coordinates
                    if (!latLon || latLon.length < 2 ||
                        latLon[0] === undefined || latLon[1] === undefined ||
                        latLon[0] === null || latLon[1] === null)
                        return false;

                    var safeId = _w.utils.encode(id);
                    if (_layers.hasOwnProperty(safeId)) {
                        // Map geo coordinates to SVG
                        var mappedPos = _mapLayer._project(latLon);

                        // Add to content
                        _layers[safeId].append.dot(mappedPos[0], mappedPos[1], r, color);

                        // Draw it right away
                        _layers[safeId].draw.dot(mappedPos[0], mappedPos[1], r, color);
                        return true;
                    } else {
                        return false;
                    }
                }
            };

            // Public methods
            return {
                _style: _style,
                _clear: _clear,
                _restore: _restore,
                _render: _render,
                get: get,
                add: add,
                highlight: highlight,
                erase: erase,
                draw: draw
            };
        })();

        // Public methods
        this.staticLayer = {
            get: _staticLayer.get,
            add: _staticLayer.add,
            erase: _staticLayer.erase,
            highlight: _staticLayer.highlight,
            draw: _staticLayer.draw
        };

        /**
         * The dynamic layers namespace.
         *
         * Dynamic layers are used to draw temporary, usually animated primitives on the map.
         * Note that every element drawn to the dynamic layer is removed after 10 seconds to avoid elements being
         * stuck in the map (e.g., due to the browser being in the background or other circumstances that prevent
         * the animation.
         *
         * @namespace dynamicLayer
         * @memberOf du.widgets.map.Map
         */
        var _dynamicLayer = (function() {
            /**
             * Container of all dynamic layers.
             *
             * @var {object} _container.
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @private
             */
            var _container = _w.widget.append("div")
                .attr("id", _id + "-dynamic-layers")
                .style("position", "absolute")
                .style("pointer-events", "none");

            /**
             * List of dynamic layers.
             *
             * @var {object} _layers
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @private
             */
            var _layers = {};
            _zoom.setLayer('dynamic', _layers);

            /**
             * Returns an array of existing dynamic layers.
             *
             * @method get
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @returns {Array} Array of existing dynamic layer IDs.
             */
            function get() {
                return Object.keys(_layers);
            }

            /**
             * Adds a new static layer to the map if it there is no layer with the same ID already.
             *
             * @method add
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @param {string} id Identifier of the new static layer.
             * @returns {boolean} True if new layer could be added, false otherwise.
             */
            function add(id) {
                var safeId = _w.utils.encode(id);
                if (!_layers.hasOwnProperty(safeId)) {
                    // Add dynamic layer (SVG element)
                    _layers[safeId] = (function() {
                        // The SVG container for the dynamic content
                        var _g = _container.append("svg")
                            .attr("id", _id + "-dynamic-layer-" + safeId)
                            .attr("width", _w.attr.width + "px")
                            .attr("height", _w.attr.height + "px")
                            .style("position", "absolute")
                            .style("pointer-events", "none")
                            .append("g");

                        // Content of the layer
                        var _content = [];

                        // Appends an element to the content
                        function append(elem) {
                            _content.push({
                                elem: elem,
                                birth: new Date().getTime()/1000
                            });
                        }

                        // Start some regular automatic erase to prevent elements stuck on the map.
                        setInterval(function() {
                            // Remove too old elements and collect young ones
                            var now = new Date().getTime()/1000;
                            var content = [];
                            _content.forEach(function(d) {
                                if (now - d.birth > 10) {
                                    d.elem
                                        .transition().duration(700)
                                        .style("opacity", 0)
                                        .on("end", function() {
                                            d3.select(this).remove();
                                        });
                                } else {
                                    content.push(d);
                                }
                            });

                            // Update content
                            _content = content;
                        }, 2000);

                        // Public members/methods
                        return {
                            g: _g,
                            append: append
                        }
                    })();
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Styles all dynamic layers.
             *
             * @method _style
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @private
             */
            function _style() {
                // Update container
                _container
                    .style("width", _w.attr.width + "px")
                    .style("height", _w.attr.height + "px");

                // Update layers
                _.forOwn(_layers, function(layer) {
                    layer.g
                        .attr("width", _w.attr.width + "px")
                        .attr("height", _w.attr.height + "px");
                });
            }

            /**
             * Erases a dynamic layers.
             *
             * @method erase
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @param {string} id Identifier of the dynamic layer to erase.
             * @returns {boolean} True if layer exists and could be erased, false otherwsise.
             */
            function erase(id) {
                var safeId = _w.utils.encode(id);
                if (_layers.hasOwnProperty(safeId)) {
                    _layers[safeId].g.html("");
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Highlights a specific dynamic layer. If no layer is passed, removes highlight.
             *
             * @method highlight
             * @memberOf du.widgets.map.Map.dynamicLayer
             * @param {string} id Identifier of the layer to highlight. If not given, highlight is cancelled.
             */
            function highlight(id) {
                var safeId = _w.utils.encode(id);
                if (safeId && _layers.hasOwnProperty(safeId)) {
                    _.forOwn(_layers, function(layer, name) {
                        layer.g
                            .transition().duration(200)
                            .style("opacity", safeId === name ? 1 : 0);
                    });
                } else {
                    _.forOwn(_layers, function(layer) {
                        layer.g
                            .transition().duration(200)
                            .style("opacity", 1);
                    });
                }
            }

            /**
             * Namespace containing drawing methods.
             *
             * @namespace draw
             * @memberOf du.widgets.map.Map.dynamicLayer
             */
            var draw = {
                /**
                 * Draws a shrinking dot on a dynamic layer.
                 *
                 * @method dot
                 * @memberOf du.widgets.map.Map.dynamicLayer.draw
                 * @param {string} id Identifier of the dynamic layer to use.
                 * @param {Array} latLon Array containing the latitude and longitude of the dot center.
                 * @param {number} r Radius of the dot.
                 * @param {string=} color Color of the dot.
                 * @param {number=} duration Duration of the dot animation. If not specified, no animation is performed.
                 * @returns {boolean} True if layer exists, coordinates are valid and dot could be added,
                 * false otherwise.
                 */
                dot: function(id, latLon, r, color, duration) {
                    // Check geo coordinates
                    if (!latLon || latLon.length < 2 ||
                        latLon[0] === undefined || latLon[1] === undefined ||
                        latLon[0] === null || latLon[1] === null)
                        return false;

                    var safeId = _w.utils.encode(id);
                    if (_layers.hasOwnProperty(safeId)) {
                        // Map geo coordinates to SVG
                        var adjustedR = r / _zoom.level();
                        var mappedPos = _mapLayer._project(latLon);

                        var d = _layers[safeId].g.append("circle")
                            .attr("cx", mappedPos[0])
                            .attr("cy", mappedPos[1])
                            .attr("r", adjustedR)
                            .style("fill", color);
                        _layers[safeId].append(d);

                        if (duration) {
                            d.transition().duration(duration).ease(d3.easeExp)
                                .attr("r", 0)
                                .on("end", function() {
                                    d3.select(this).remove();
                                });
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
            };

            // Public methods
            return {
                _style: _style,
                get: get,
                add: add,
                highlight: highlight,
                erase: erase,
                draw: draw
            };
        })();

        // Public methods
        this.dynamicLayer = {
            get: _dynamicLayer.get,
            add: _dynamicLayer.add,
            highlight: _dynamicLayer.highlight,
            erase: _dynamicLayer.erase,
            draw: _dynamicLayer.draw
        };

        /**
         * The invisible touch layer namespace.
         *
         * The touch layer is used to place invisible interactive elements on the map.
         *
         * @namespace touchLayer
         * @memberOf du.widgets.map.Map
         */
        var _touchLayer = (function(){
            // The SVG container for the touch content
            var _container = _w.widget.append("svg")
                .attr("id", _id + "-touch-layer")
                .attr("width", _w.attr.width + "px")
                .attr("height", _w.attr.height + "px")
                .style("position", "absolute")
                .style("pointer-events", "none");
            var _g = _container.append("g");
            _zoom.setLayer('touch', _g);

            /**
             * Adds a touch element to the touch layer. A touch element is an invisible circle.
             *
             * @method add
             * @memberOf du.widgets.map.Map.touchLayer
             * @param {string} id Identifier of the touch element.
             * @param {Array} latLon Array containing the geo coordinates of the touch element.
             * @param {number} r Radius of the touch element.
             * @param {function=} mouseover Callback on hovering the touch element.
             * @param {function=} mouseleave Callback on leaving the touch element.
             * @param {function=} click Callback on clicking the touch element.
             * @returns {boolean} True if coordinates are valid and touch element could be added, false otherwise.
             */
            function add(id, latLon, r, mouseover, mouseleave, click) {
                // If (lat, lon) is invalid, skip
                if (!latLon || latLon.length < 2 || typeof latLon[0] !== "number" || typeof latLon[1] !== "number")
                    return false;

                // Map geo coordinates to SVG
                var adjustedR = r / _zoom.level();
                var mappedPos = _mapLayer._project(latLon);

                _g.append("circle")
                    .attr("id", _id + "-touch-layer-" + id)
                    .attr("data-r", r)
                    .attr("cx", mappedPos[0])
                    .attr("cy", mappedPos[1])
                    .attr("r", adjustedR)
                    .style("fill", null)
                    .style("opacity", 0)
                    .style("pointer-events", "all")
                    .on("mouseover", function(d, i) {
                        if (mouseover)
                            mouseover(d, i);
                    })
                    .on("mouseleave", function(d, i) {
                        if (mouseleave)
                            mouseleave(d, i);
                    })
                    .on("click", function(d, i) {
                        if (click)
                            click(d, i);
                    });
                return true;
            }

            /**
             * Removes a touch element from the layer.
             *
             * @method remove
             * @memberOf du.widgets.map.Map.touchLayer
             * @param {string} id Identifier of the touch element to remove.
             * @returns {boolean} True if element could be removed, false otherwise.
             */
            function remove(id) {
                var elem = _g.select("#" + id);
                if (elem.empty())
                    return false;
                else {
                    elem.remove();
                    return true;
                }
            }

            /**
             * Styles touch layer.
             *
             * @method _style
             * @memberOf du.widgets.map.Map.touchLayer
             * @private
             */
            function _style() {
                _container
                    .style("width", _w.attr.width + "px")
                    .style("height", _w.attr.height + "px");
                _g
                    .style("width", _w.attr.width + "px")
                    .style("height", _w.attr.height + "px");
            }

            /**
             * Erases the touch layer.
             *
             * @method erase
             * @memberOf du.widgets.map.Map.touchLayer
             */
            function erase() {
                _g.html("");
            }

            // Public methods
            return {
                _style: _style,
                add: add,
                remove: remove,
                erase: erase
            };
        })();

        // Public methods
        this.touchLayer = {
            add: _touchLayer.add,
            remove: _touchLayer.remove,
            erase: _touchLayer.erase
        };

        _w.render.build = function() {
            _mapLayer._build();
        };

        // Data updater
        _w.render.update = function() {
            // Update map layer
            _mapLayer._update();
        };

        // Style updater
        _w.render.style = function() {
            _w.widget
                .style("background-color", _w.attr.backgroundColor)
                .style("pointer-events", null);

            // Init zoom bounds
            _zoom.init();

            // Style layers
            _mapLayer._style();
            _staticLayer._style();
            _dynamicLayer._style();
            _touchLayer._style();

            // Mark clusters
            _clustering._mark();
        };
    }

    // Export
    Map.prototype = Object.create(Widget.prototype);
    return Map;
}));
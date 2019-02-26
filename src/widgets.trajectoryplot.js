/**
 * Module implementing a trajectory plot. A trajectory plot is a two dimensional chart showing the sequence of positions
 * for an object moving in time.
 *
 * @author Enys Mones (enys.mones@sony.com)
 * @module trajectoryplot
 * @memberOf du.widgets
 * @requires d3@v4
 * @requires du.Widget
 */
(function (global, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(require('d3'), require('./widget'));
    } else if (typeof define === 'function' && define.amd) {
        define(['d3', 'd3-contour', 'src/widget', 'exports'], factory);
    } else {
        global.du = global.du || {};
        global.du.widgets = global.du.widgets || {};
        global.du.widgets.TrajectoryPlot = factory(global.d3, global.du.Widget);
    }
} (this, function (d3, Widget) {
    'use strict';

    /**
     * The trajectory plot widget class.
     *
     * @class TrajectoryPlot
     * @memberOf du.widgets.trajectoryplot
     * @param {string} name Identifier of the widget.
     * @param {object=} parent Parent element to append widget to. If not specified, widget is appended to body.
     * @constructor
     * @extends {du.widget.Widget}
     */
    function TrajectoryPlot(name, parent) {
        var _w = Widget.call(this, name, "trajectoryplot", "svg", parent);

        /**
         * Sets the boundary of the area for the trajectories. Default is [0, 1, 0, 1].
         *
         * @method boundary
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {number[]} dim Array containing the minimum and maximum of the x and y coordinates in the following
         * order: [xmin, xmax, ymin, ymax].
         * t
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        _w.attr.add(this, 'boundary', [0, 1, 0, 1]);

        /**
         * Sets the maximum trajectory length to the specified value. Default is 10.
         *
         * @method maxLength
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {number} length The number of historical positions to show.
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        _w.attr.add(this, 'maxLength', 10);

        /**
         * Adds an image to the background of the trajectory plot. Note that the image is scaled up to fit the plot.
         * Default is empty.
         *
         * @method background
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {Object} options Object containing the background options. The following properties are supported:
         * <ul>
         *     <li><code>path</code>: Path to the image file.</li>
         *     <li><code>opacity</code>: Background opacity. Default is 1.</li>
         * </ul>
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        _w.attr.add(this, 'background', {});

        /**
         * Enables animation on new trajectory points. Default is false.
         *
         * @method animate
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {boolean} on Whether animation should be enabled or not.
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        _w.attr.add(this, 'animate', false);

        // Widget elements.
        var _svg = {};
        var _data = [];
        var _current = null;
        var _colors = null;
        var _transition = false;
        var _markers = {};

        /**
         * Binds data to the trajectory plot.
         * Expected data format: array of objects with two properties: {name} which is the name of the trajectory and
         * {values} which is an array containing {(t, x, y)} objects for the trajectory points. The property {t} denotes
         * the time of the position and each trajectory is sorted according to that value in ascending order (so {t}
         * should have properly sortable values).
         *
         * @method data
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {Array} data Data to plot.
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        this.data = function (data) {
            // TODO Add noise to the points
            _data = data.map(function (d) {
                return {
                    name: d.name,
                    values: d.values.sort(function (a, b) {
                        return a.t - b.t;
                    }).filter(function(dd, i) {
                        return i >= d.values.length - _w.attr.maxLength;
                    }).map(function(dd, i, arr) {
                        return {
                            name: d.name,
                            t: dd.t,
                            x: dd.x,
                            y: dd.y,
                            r: Math.min(1, i / arr.length),
                            last: i === arr.length - 1
                        };
                    })
                };
            });
            return this;
        };

        /**
         * Highlights the specified trajectory.
         *
         * @method highlight
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {(string|string[])} key Single key or an array of keys of the dot group(s) to highlight.
         * @param {number} duration Duration of the highlight animation.
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        this.highlight = function (key, duration) {
            if (!_transition) _w.utils.highlight(this, _svg, ".trajectory", key, duration);
            return this;
        };

        /**
         * Adds a marker to the plot.
         * A marker is a dot along with some data that is used to show on tooltips.
         * If a marker with the specified identifier already exists, the marker is ignored.
         *
         * @method addMarker
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {string} id Marker identifier.
         * @param {string} name Name of the marker.
         * @param {string} key Key of the line to mark.
         * @param {number[]} pos Array containing the x and y coordinates of the marker.
         * @param {Object} data Object containing any data contained in the marker.
         * @returns {?Object} D3 selection of the marker if it could be added, null otherwise.
         */
        this.addMarker = function (id, name, key, pos, data) {
            // Check if marker exists
            if (_markers.hasOwnProperty(id)) {
                return null;
            }

            var g = _svg.g.append("g")
                .attr("class", "marker " + _w.utils.encode(key));
            var circle = g.append("circle")
                .attr("cx", _svg.scale.x(pos[0]) + 2)
                .attr("cy", _svg.scale.y(pos[1]))
                .attr("r", _w.attr.animate ? 10 : 7)
                .style("stroke-width", "2px")
                .style("stroke", "white")
                .style("fill", _colors[key]);
            if (_w.attr.animate) {
                circle.transition().duration(700)
                    .attr('r', 7);
            }

            var marker = {
                key: key,
                g: g,
                update: function (duration) {
                    g.select("circle")
                        .on("mouseover", function () {
                            _current = {
                                name: name,
                                type: 'marker',
                                data: data
                            };
                            _w.attr.mouseover && _w.attr.mouseover(key);
                        })
                        .on("mouseleave", function () {
                            _current = null;
                            _w.attr.mouseleave && _w.attr.mouseleave(key);
                        })
                        .on("click", function () {
                            _w.attr.click && _w.attr.click(key);
                        })
                        .transition().duration(duration)
                        .attr("cx", _svg.scale.x(pos[0]) + 2)
                        .attr("cy", _svg.scale.y(pos[1]))
                        .style("fill", _colors[this.key]);
                }
            };

            // Add to markers
            _markers[id] = marker;

            // Return marker
            return marker;
        };

        /**
         * Removes a marker from the plot.
         *
         * @method removeMarker
         * @memberOf du.widgets.trajectoryplot.TrajectoryPlot
         * @param {string} id Identifier of the marker to remove.
         * @returns {du.widgets.trajectoryplot.TrajectoryPlot} Reference to the current TrajectoryPlot.
         */
        this.removeMarker = function (id) {
            if (_markers.hasOwnProperty(id)) {
                _markers[id].g.remove();
                delete _markers[id];
                return true;
            }
            return false;
        };

        _w.utils.tooltip = function (mouse) {
            if (!mouse || _current === null) {
                this.pm && this.pm.remove();
                this.pm = null;
                this.mm && this.mm.remove();
                this.mm = null;
                _current = null;
                return null;
            }

            // Tooltip
            switch (_current.type) {
                case 'marker':
                    // Remove tooltip markers
                    this.pm && this.pm.remove();
                    this.pm = null;
                    this.mm && this.mm.remove();
                    this.mm = null;

                    // Content
                    return {
                        title: _w.attr.tooltipTitleFormat(_current.name + ' (marker)'),
                        stripe: _colors[_current.name],
                        content: {
                            type: 'metrics',
                            data: [{
                                label: 'data: ' + JSON.stringify(_current.data)
                            }]
                        }
                    };

                case 'movement':
                    // Marker
                    this.mm = this.mm || _svg.g.append('line');
                    this.mm.attr("x1", _svg.scale.x(_current.data[0].x))
                        .attr("y1", _svg.scale.y(_current.data[0].y))
                        .attr("x2", _svg.scale.x(_current.data[1].x))
                        .attr("y2", _svg.scale.y(_current.data[1].y))
                        .style("pointer-events", "none")
                        .style("stroke-width", '2px')
                        .style("stroke", 'black')
                        .style("fill", 'none')
                        .style('display', null);
                    this.pm && this.pm.remove();
                    this.pm = null;

                    // Content
                    return {
                        title: _w.attr.tooltipTitleFormat(_current.name + ' (movement)'),
                        stripe: _colors[_current.name],
                        content: {
                            type: 'metrics',
                            data: [
                                {label: 'from: '
                                    + _w.attr.tooltipZFormat(_current.data[0].t)
                                    + ', (' + _w.attr.tooltipXFormat(_current.data[0].x)
                                    + ', ' + _w.attr.tooltipYFormat(_current.data[0].y)
                                    + ')'},
                                {label: 'to: &nbsp;&nbsp;'
                                    + _w.attr.tooltipZFormat(_current.data[1].t)
                                    + ', (' + _w.attr.tooltipXFormat(_current.data[1].x)
                                    + ', ' + _w.attr.tooltipYFormat(_current.data[1].y)
                                    + ')'}
                            ]
                        }
                    };
                case 'position':
                    // Marker
                    this.pm = this.pm || _svg.g.append("circle");
                    this.pm.attr("r", 6)
                        .attr("cx", _svg.scale.x(_current.data.x))
                        .attr("cy", _svg.scale.y(_current.data.y))
                        .style("pointer-events", "none")
                        .style("stroke-width", '2px')
                        .style("stroke", 'white')
                        .style("fill", 'black')
                        .style('display', null);
                    this.mm && this.mm.remove();
                    this.mm = null;

                    // Content
                    return {
                        title: _w.attr.tooltipTitleFormat(_current.name + ' (position)'),
                        stripe: _colors[_current.name],
                        content: {
                            type: 'metrics',
                            data: [
                                {label: 'location: ('
                                    + _w.attr.tooltipXFormat(_current.data.x)
                                    + ', '
                                    + _w.attr.tooltipYFormat(_current.data.y) + ')'},
                                {label: 'time: &nbsp;&nbsp;&nbsp;&nbsp;' + _w.attr.tooltipZFormat(_current.data.t)}
                            ]
                        }
                    };
                default:
                    return null;
            }
        };

        // Builder
        _w.render.build = function () {
            _svg = _w.utils.standardAxis();
            _svg.plots = {};

            // Add background
            _svg.backgroundPattern = _svg.g.append('defs')
                .append('pattern')
                .attr('id', 'trajectory-background-' + _w.utils.encode(name))
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', _w.attr.innerWidth)
                .attr('height', _w.attr.innerHeight);
            _svg.backgroundImage = _svg.backgroundPattern.append('image')
                .attr('xlink:href', _w.attr.background.path ? _w.attr.background.path : null)
                .attr('preserveAspectRatio', 'none')
                .attr('x', 1)
                .attr('y', 0)
                .attr('width', _w.attr.innerWidth + 'px')
                .attr('height', _w.attr.innerHeight + 'px');
            _svg.background = _svg.g.append('rect')
                .attr('x', 1)
                .attr('y', 0)
                .attr('width', _w.attr.innerWidth + 'px')
                .attr('height', _w.attr.innerHeight + 'px')
                .attr('stroke', 'none')
                .attr('fill', _w.attr.background.path ? 'url(#'  + 'trajectory-background-' + _w.utils.encode(name) +')' : 'none')
                .style('opacity', _w.attr.background.opacity ? _w.attr.background.opacity : null);
        };

        // Data updater
        _w.render.update = function (duration) {
            // Calculate scale
            _svg.scale = {
                x: _w.utils.scale([_w.attr.boundary[0], _w.attr.boundary[1]], [0, _w.attr.innerWidth]),
                y: _w.utils.scale([_w.attr.boundary[2], _w.attr.boundary[3]], [_w.attr.innerHeight, 0])
            };

            // Update axes
            _svg.axes.x
                .transition().duration(duration)
                .call(_svg.axisFn.x
                    .tickValues(_w.attr.xTicks)
                    .scale(_svg.scale.x));
            _svg.axes.y
                .transition().duration(duration)
                .call(_svg.axisFn.y
                    .tickValues(_w.attr.yTicks)
                    .scale(_svg.scale.y));

            // Build/update trajectory groups
            _colors = _w.utils.colors(_data ? _data.map(function (d) {
                return d.name;
            }) : null);

            // Groups
            _svg.plots.trajectories = _svg.g.selectAll(".trajectory")
                .data(_data, function (d) {
                    return d.name;
                });
            _svg.plots.trajectories.exit()
                .transition().duration(duration)
                .style('opacity', 0)
                .remove();
            var groups = _svg.plots.trajectories.enter().append("g")
                .attr("class", function (d) {
                    return "trajectory " + _w.utils.encode(d.name);
                })
                .style("shape-rendering", "geometricPrecision")
                .style("color", function (d) {
                    return _colors[d.name];
                });
            _svg.plots.trajectories = groups.merge(_svg.plots.trajectories)
                .each(function () {
                    _transition = true;
                });
            _svg.plots.trajectories
                .transition().duration(duration)
                .style("opacity", 1)
                .on("end", function () {
                    _transition = false;
                });

            // Positions
            _svg.plots.positions = _svg.plots.trajectories.selectAll(".position")
                .data(function (d) {
                    return d.values;
                }, function(d) {
                    return d.t;
                });
            _svg.plots.positions.exit()
                .attr('r', 1)
                .transition().duration(duration)
                .style("opacity", 0)
                .remove();
            _svg.plots.positions.enter().append("circle")
                .attr("class", function(d) {
                    return "position position-" + d.t;
                })
                .attr("cx", function (d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.y);
                })
                .attr('r', _w.attr.animate ? 10 : 1)
                .style("stroke", "none")
                .style("fill", "currentColor")
                .merge(_svg.plots.positions)
                .transition().duration(duration)
                .attr("r", function(d) {
                    return d.last ? 5 : 1;
                })
                .style('opacity', function(d) {
                    return d.last ? 1 : d.r;
                });

            // Movements
            _svg.plots.movements = _svg.plots.trajectories.selectAll('.movement')
                .data(function (d) {
                    return d.values.map(function(dd, i) {
                        return i > 0 ? [d.values[i - 1], dd] : null;
                    }).filter(function(dd) {
                        return dd !== null;
                    });
                }, function(d) {
                    return d[0].t;
                });
            _svg.plots.movements.exit()
                .transition().duration(duration)
                .attr("x1", function (d) {
                    return _svg.scale.x(d[1].x);
                })
                .attr("y1", function (d) {
                    return _svg.scale.y(d[1].y);
                })
                .style('opacity', 0)
                .remove();
            _svg.plots.movements.enter().append('line')
                .attr("class", function(d) {
                    return "movement movement-" + d[0].t + '-' + d[1].t;
                })
                .style("stroke-width", "2px")
                .style("stroke", "currentColor")
                .style("fill", "none")
                .attr("x1", function (d) {
                    return _svg.scale.x(d[0].x);
                })
                .attr("y1", function (d) {
                    return _svg.scale.y(d[0].y);
                })
                .attr("x2", function (d) {
                    return _svg.scale.x(d[0].x);
                })
                .attr("y2", function (d) {
                    return _svg.scale.y(d[0].y);
                })
                .merge(_svg.plots.movements)
                .transition().duration(duration)
                .attr("x2", function (d) {
                    return _svg.scale.x(d[1].x);
                })
                .attr("y2", function (d) {
                    return _svg.scale.y(d[1].y);
                })
                .style('opacity', function(d) {
                    return (d[0].r + d[1].r) / 2;
                });

            // Fake movements
            _svg.plots.fakeMovements = _svg.plots.trajectories.selectAll('.fake-movement')
                .data(function (d) {
                    return d.values.map(function(dd, i) {
                        return i > 0 ? [d.values[i - 1], dd] : null;
                    }).filter(function(dd) {
                        return dd !== null;
                    });
                }, function(d) {
                    return d[0].t;
                });
            _svg.plots.fakeMovements.exit().remove();
            _svg.plots.fakeMovements.enter().append('line')
                .attr("class", function(d) {
                    return "fake-movement fake-movement-" + d[0].t + '-' + d[1].t;
                })
                .style("stroke-width", "8px")
                .style("stroke", "transparent")
                .style("fill", "none")
                .attr("x1", function (d) {
                    return _svg.scale.x(d[0].x);
                })
                .attr("y1", function (d) {
                    return _svg.scale.y(d[0].y);
                })
                .attr("x2", function (d) {
                    return _svg.scale.x(d[1].x);
                })
                .attr("y2", function (d) {
                    return _svg.scale.y(d[1].y);
                })
                .merge(_svg.plots.fakeMovements)
                .on("mouseover", function (d) {
                    _current = {
                        name: d[0].name,
                        type: 'movement',
                        data: d
                    };
                    _w.attr.mouseover && _w.attr.mouseover(d[0].name);
                })
                .on("mouseleave", function (d) {
                    _current = null;
                    _w.attr.mouseleave && _w.attr.mouseleave(d[0].name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d[0].name);
                });
            // Fake positions
            _svg.plots.fakePositions = _svg.plots.trajectories.selectAll(".fake-position")
                .data(function (d) {
                    return d.values;
                }, function(d) {
                    return d.t;
                });
            _svg.plots.fakePositions.exit()
                .remove();
            _svg.plots.fakePositions.enter().append("circle")
                .attr("class", function(d) {
                    return "fake-position fake-position-" + d.t;
                })
                .attr("cx", function (d) {
                    return _svg.scale.x(d.x);
                })
                .attr("cy", function (d) {
                    return _svg.scale.y(d.y);
                })
                .attr('r', 5)
                .style("stroke", "none")
                .style("fill", "transparent")
                .merge(_svg.plots.fakePositions)
                .on("mouseover", function (d) {
                    _current = {
                        name: d.name,
                        type: 'position',
                        data: d
                    };
                    _w.attr.mouseover && _w.attr.mouseover(d.name);
                })
                .on("mouseleave", function (d) {
                    _current = null;
                    _w.attr.mouseleave && _w.attr.mouseleave(d.name);
                })
                .on("click", function (d) {
                    _w.attr.click && _w.attr.click(d.name);
                });

            // Markers
            for (var marker in _markers) {
                if (_markers.hasOwnProperty(marker)) {
                    _markers[marker].update(duration);
                }
            }
        };

        // Style updater
        _w.render.style = function () {
            // Chart
            _svg.g
                .attr("width", _w.attr.innerWidth + "px")
                .attr("height", _w.attr.innerHeight + "px")
                .attr("transform", "translate(" + _w.attr.margins.left + "," + _w.attr.margins.top + ")")
                .style("pointer-events", "all");

            // Axes
            _svg.axisFn.x.tickFormat(_w.attr.xTickFormat);
            _svg.axes.x
                .attr("transform", "translate(0," + _w.attr.innerHeight + ")");
            _svg.axisFn.y.tickFormat(_w.attr.yTickFormat);
            _svg.axes.y
                .attr("transform", "translate(0," + 1 + ")");
            _svg.g.selectAll(".tick > line")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width", "1px");

            // Labels
            _svg.labels.x
                .attr("x", _w.attr.innerWidth + "px")
                .attr("y", (_w.attr.innerHeight + 2.2 * _w.attr.fontSize) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.xLabel);
            _svg.labels.y
                .attr("x", 5 + "px")
                .attr("y", (-5) + "px")
                .attr("fill", _w.attr.fontColor)
                .style("font-size", _w.attr.fontSize + "px")
                .text(_w.attr.yLabel);

            // Background
            _svg.backgroundPattern
                .attr('width', _w.attr.innerWidth)
                .attr('height', _w.attr.innerHeight);
            _svg.backgroundImage
                .attr('width', _w.attr.innerWidth + 'px')
                .attr('height', _w.attr.innerHeight + 'px');
            _svg.background
                .attr('width', _w.attr.innerWidth + 'px')
                .attr('height', _w.attr.innerHeight + 'px')
                .attr('fill', _w.attr.background.path ? 'url(#'  + 'trajectory-background-' + _w.utils.encode(name) +')' : 'none')
                .style('opacity', _w.attr.background.opacity ? _w.attr.background.opacity : null);
        }
    }

    // Export
    TrajectoryPlot.prototype = Object.create(Widget.prototype);
    return TrajectoryPlot;
}));
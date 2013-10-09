/*global define */
define(['d3', 'queue', 'topojson'], function (d3, queue, topojson) {
    'use strict';

    var title = d3.select('h1');

    var width = 960,
        height = 500;

    var projection = d3.geo.orthographic()
        .scale(248)
        .clipAngle(90);

    var canvas = d3.select('body').append('canvas')
        .attr('width', width)
        .attr('height', height);

    var c = canvas.node().getContext('2d');

    var graticule = d3.geo.graticule();

    var path = d3.geo.path()
        .projection(projection)
        .context(c);

    var methods = {
        init: function() {
            var that = this;

            return function() {
                queue()
                    .defer(d3.json, 'data/world-110m.json')
                    .defer(d3.tsv, 'data/world-country-names.tsv')
                    .await(that.ready);
            };
        },
        ready: function(error, world, names) {
            var globe = {type: 'Sphere'},
                land = topojson.feature(world, world.objects.land),
                countries = topojson.feature(world, world.objects.countries).features,
                borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }),
                i = -1,
                n = countries.length;

            countries = countries.filter(function(d) {
                return names.some(function(n) {
                    if (d.id == n.id) {
                        return d.name = n.name;
                    }
                });
            }).sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });

            (function transition() {
                d3.transition()
                    .duration(1250)
                    .each('start', function() {
                        title.text(countries[i = (i + 1) % n].name);
                        if(typeof gapi !== 'undefined') {
                           //  app.realtime(53340307);
                        }
                    })
                    .tween('rotate', function() {
                        var p = d3.geo.centroid(countries[i]),
                            r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
                        return function(t) {
                            projection.rotate(r(t));
                            c.clearRect(0, 0, width, height);
                            c.fillStyle = '#000011';
                            c.fill();

                            c.fillStyle = '#111111';
                            c.beginPath();
                            path(land);
                            c.fill();

                            c.fillStyle = '#f00';
                            c.beginPath();
                            path(countries[i]);
                            c.fill();

                            c.strokeStyle = '#000';
                            c.lineWidth = 0.5;
                            c.beginPath();
                            path(borders);
                            c.stroke();

                            c.strokeStyle = '#000';
                            c.lineWidth = 2;
                            c.beginPath();
                            path(globe);
                            c.stroke();

                        };
                    })
                  .transition()
                      .each('end', transition);
            })();
        }
    };

    return {
        init: methods.init()
    };
});
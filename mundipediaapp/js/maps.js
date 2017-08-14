function MyMap(element_id) {
    var obj = {};

    var tooltip = d3.select("body").append("div").attr("class", "map-tooltip hidden");

    obj.element_id = element_id;

    obj.drawMapEdge = false;
    obj.isZoomable = true;

    obj.width = $(window).width();
    obj.height = $(window).height() - $("#mainnav").height();

    obj.projectionMode = "hammer";

    obj.mapFontSize = 13;
    obj.FONT_SIZE_INCREMENT = 1.1;

    obj.width = $(window).width();
    obj.height = $(window).height() - $("#mainnav").height();

    obj.svg = d3.select("#" + element_id);

    obj.svg.attr("width", obj.width)
        .attr("height", obj.height)
        .style("padding", "0")
        .style("cursor", "pointer");

    obj.g = null;

    //TODO: rework this
    $(window).keypress(function (event) {
        if (event.which === 43) { //"+"
            if (obj.zoom) {
                obj.zoom.scale(obj.zoom.scale() * 1.2);
                obj.zoom.event(obj.svg);
            }
        }
        if (event.which === 45) { //"-"
            if (obj.zoom) {
                obj.zoom.scale(obj.zoom.scale() / 1.2);
                obj.zoom.event(obj.svg);
            }
        }
    });

    obj.drawTooltip = function(d) {
        var text = obj.getEntityName(d) + "<br/>Population:<br/>Area: " + d.properties.area;
        if (d.properties.currency) {
            text += "<br/>Currency: " + d.properties.currency;
        }
        if (d.properties.gov_type) {
            text += "<br/>Gov Type: " + d.properties.gov_type;
        }
        tooltip.style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY + 5) + "px")
                    .html(text);
    }

    String.prototype.hashCode = function(hash) {
        hash = (hash || 0) ^ 431;

        for (var i = 0, len = this.length; i < len; i++) {
            hash  = hash + ((hash << 5) ^ (hash >> 20)) + this.charCodeAt(i);
            hash |= 0;
        }
        hash = Math.abs(hash);

        return hash;
    }

    obj.getElementFillColor = function(d) {
        var name = obj.getEntityName(d);
        var letters = '6789ABCD'.split('');
        var color = '#';

        if (name === "") {
            name = Math.random().toString();
        }

        for (var i = 0; i < 3; i++ ) {
            var hash = name.hashCode(100 * i);
            var index = hash % letters.length;
            color += letters[index];
        }
        return color;
    }

    obj.getEntityName = function(d) {
        return d.properties.name || d.properties.ctr_name || "";
    }

    obj.setSize = function(width, height) {
        obj.height = height;
        obj.width = width;
        obj.svg.attr("width", obj.width).attr("height", obj.height);

        //if (isPlanarProjection) {
        //    //TODO: fix globe centering
        //    projection.translate([mapWidth / 2, mapHeight / 2]);
        //}
    }

    obj.interpolateProjections = function(proj1, proj2, t) {
        var projection = d3.geo.projection(function(λ, φ) {
            λ *= 180 / Math.PI, φ *= 180 / Math.PI;
            var p0 = proj1([λ, φ]), p1 = proj2([λ, φ]);
            return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        })
    }

    obj.drawGlobePlanar = function() {
        obj.svg.style("background", "#CCC");

        obj.globeEdge = obj.svg.append("defs").append("path")
            .datum({type: "Sphere"})
            .attr("id", "globe-edge")
            .attr("d", obj.path);

        obj.g.append("use")
            .style("fill", "#ADF")
            .attr("xlink:href", "#globe-edge");

    }

    obj.zoomScale = function() {
        return obj.zoom.scale() || 1;
    }

    obj.getLabelBox = function(label) {
        var padding;
        label.box = label.node().getBoundingClientRect();
        padding = label.box.height * 0.5;
        label.box.left -= padding;
        label.box.right += padding;
        label.box.top -= padding;
        label.box.bottom += padding;
        return label.box;
    }

    //obj.recalculateLabelBoxes = function() {
    //    obj.oldLabelScale = obj.zoomScale();
    //}

    //function to redraw all the labels
    //also checks for overlaps for label boxes, and hides the ones with lower priority
    obj.resetLabelVisibility = function() {
        //TODO: skip this when panning planar projection
        var start = Date.now();
        var N = obj.labels.length;
        for (var i = 0; i < N; i++) {
            obj.labels[i].box = obj.getLabelBox(obj.labels[i]);
        }

        console.log("Visibility bbox duration " + (Date.now() - start) + " ms");

        function inBetween(a, b, c) {
            return a <= c && c <= b;
        }

        var nrOp = 0;

        //console.log("With sort " + (Date.now() - start) + " ms");
        //TODO: insert in a temporary array one by one
        //TODO: quad tree algorithm
        for (var i = 0; i < N; i++) {
            obj.labels[i].isVisible = (obj.labels[i].position != null);
            for (var j = i + 1; j < N; j++) {
                nrOp++;
                var r1 = obj.labels[i].box;
                var r2 = obj.labels[j].box;
                //var interX = inBetween(r1.left, r1.right, r2.left) || inBetween(r2.left, r2.right, r1.left);
                //var interY = inBetween(r1.top, r1.bottom, r2.top) || inBetween(r2.top, r2.bottom, r1.top);

                var interX = (r1.left <= r2.left && r2.left <= r1.right) || (r2.left <= r1.left && r1.left <= r2.right);
                var interY = (r1.top <= r2.top && r2.top <= r1.bottom) || (r2.top <= r1.top && r1.top <= r2.bottom);

                if (interX && interY) {
                    obj.labels[i].isVisible = false;
                    break;
                }
            }
            obj.labels[i]
                .style("visibility", obj.labels[i].isVisible ? "visible" : "hidden")
                .style("font-size", obj.getFontSize());
        }
        console.log("Visibility duration " + (Date.now() - start) + " ms");
        console.log("Total Op - " + nrOp);
    }

    obj.setProjectionMode = function(projectionMode) {
        if (obj.projectionMode === projectionMode) {
            return;
        }

        // create a first guess for the projection
        var allProjections = [
            {name: "eckert4", projection: d3.geo.eckert4().scale(0.38), isPlanar: true, isZoomable: true},
            {name: "mercator", projection: d3.geo.mercator().scale(0.27), isPlanar: true, isZoomable: true},
            {name: "hammer", projection:  d3.geo.hammer().scale(0.36), isPlanar: true, isZoomable: true},
            {name: "peters", projection: d3.geo.cylindricalEqualArea().parallel(45).scale(0.36), isPlanar: true, isZoomable: true},
            {name: "spherical", projection: d3.geo.orthographic().scale(0.5).clipAngle(90), isPlanar: false, isZoomable: true},
            {name: "gilberts", projection: d3.geo.orthographic().scale(0.5).clipAngle(90), isPlanar: true, isZoomable: false},
        ];

        obj.projectionMode = projectionMode;

        obj.projection = null;

        for (var i = 0; i < allProjections.length; i++) {
            if (obj.projectionMode === allProjections[i].name) {
                obj.projection = allProjections[i].projection;

                var newScale = obj.projection.scale() * ((projectionMode === "gilberts") ? Math.min(obj.height, obj.width) : obj.height);
                obj.projection = obj.projection.scale(newScale).translate([obj.width / 2, obj.height / 2]);

                obj.isPlanarProjection = allProjections[i].isPlanar;
                obj.isZoomable = allProjections[i].isZoomable;
                break;
            }
        }

        if (obj.projection === null) {
            console.log("Invalid projection selected!");
            return;
        }

        obj.path = d3.geo.path().projection(obj.projection);
        if (obj.projectionMode === "gilberts") {
            obj.path = d3.geo.path().projection(d3.geo.gilbert(obj.projection));
        }

        if (obj.isZoomable) {
            if (obj.isPlanarProjection) {
                obj.zoom = d3.behavior.zoom()
                .translate([0, 0])
                .scale(1)
                .scaleExtent([0.5, 20])
                .on("zoom", obj.zoomPlanar);
            } else {
                obj.zoom = d3.geo.zoom()
                        .projection(obj.projection)
                        .scaleExtent([obj.projection.scale() * 0.5, obj.projection.scale() * 12])
                        .on("zoom", obj.zoomNonPlanar);
            }
        }
        if (obj.data) { //reapply the data
            obj.setData(obj.data);
        }
    }

    //TODO mciucu: add a callback to this
    obj.setData = function(json) {
        if (typeof json === "string") {
            d3.json(json, function(error, jsonData) {
                console.log("Data: " + jsonData);
                obj.setData(jsonData);
            });
            return;
        }

        var startTime = Date.now();
        obj.data = json;
        //clear the old map
        obj.svg.selectAll("*").remove();

        if (obj.isZoomable) {
            obj.svg.call(obj.zoom);
        }
        obj.g = obj.svg.append("g");

        if (obj.isPlanarProjection) {
            obj.drawGlobePlanar();
            if (obj.isZoomable) {
                obj.setMapTransform(obj.zoom.translate(), obj.zoom.scale());
            }
        } else {
            obj.drawGlobeBackground();
        }

        console.log("Before " + (Date.now() - startTime) + " ms");
        obj.entities = new Array(json.features.length)

        //TODO: first draw all objects and then try to add the event handlers
        for (var i = 0; i < json.features.length; i++) {
            obj.entities[i] = {feature: json.features[i]};
            obj.entities[i].borders = obj.g.append("path")
                .datum(json.features[i])
                .attr("d", obj.path)
                .attr("class", "country-borders")
                .style("fill", obj.getElementFillColor)
                .style("stroke-width", obj.getBorderStrokeWidth)
                .style("stroke", "black")
                //.style("opacity", (obj.projectionMode === "spherical") ? 0.75 : 1.0)
                .on("mouseover", function() { tooltip.classed("hidden", false); })
                .on("mousemove", function(d) {
                    obj.drawTooltip(d);
                    d3.select(this).
                        style("stroke-width", obj.getSelectedBorderStrokeWidth)
                        .style("stroke", "white");
                })
                .on("mouseout", function() {
                    d3.select(this).style("stroke-width", obj.getBorderStrokeWidth)
                        .style("stroke", "black");
                    tooltip.classed("hidden", true);
                })
                .on("click", function(d) {
                    if (d.properties.url) {
                        window.location.href = d.properties.url;
                    }
                });
        }

        console.log("Map done in " + (Date.now() - startTime) + " ms");

        obj.labels = [];

        for (var i = 0; i < json.features.length; i++) {
            //TODO: skip if there is no name to display
            var curFeature = obj.entities[i].feature;

            var label = D3Label(obj.g);

            //TODO: have label element with text
            label
                .d(json.features[i])
                .attr("dy", ".3em")
                //.attr("class", "country-name")
                .style("visibility", "hidden")
                .style("text-anchor", "middle")
                .style("pointer-events", "none") //so that all pointer events pass through onto the map
                .style("font-size", obj.getFontSize())
                .text(obj.getEntityName);

            curFeature.properties.area = curFeature.properties.area || (d3.geo.area(curFeature) * 40.590);

            label.priority = curFeature.properties.area;
            label.entity = obj.entities[i];

            label.setPosition(obj.getLabelPosition(curFeature));
            //label.attr("transform", "translate(" + label.position + ")");

            //debugger;
            label.box = obj.getLabelBox(label);

            obj.labels.push(label);
        }

        obj.labels.sort(function(x, y) {
           return x.priority - y.priority;
        });

        console.log("After " + (Date.now() - startTime) + " ms");

        obj.updateGraticule();
        obj.resetMapElements();

        console.log("Size: " + obj.svg.html().length)

        console.log("Fully done " + (Date.now() - startTime) + " ms");
        obj.resetLabelVisibility();
    }

    obj.getScale = function () {
        if (obj.isPlanarProjection && obj.zoom) {
            return obj.zoom.scale();
        } else {
            return 1;
        }
    }

    obj.drawGraticule = true;

    obj.updateGraticule = function(drawGraticule) {
        obj.drawGraticule = drawGraticule;
        if (!obj.g) {
            return;
        }
        if (obj.drawGraticule) {
            obj.g.append("path")
                    .datum(d3.geo.graticule())
                    .attr("class", "graticule-path")
                    .attr("d", obj.path);
        } else {
            obj.g.selectAll(".graticule-path").remove();
        }

    }

    obj.setMapTransform = function(translate, scale) {
        obj.g.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        obj.globeEdge.attr("d", obj.path);
    }

    obj.drawGlobeBackground = function() {
        obj.svg.style("background", "#CCC");

        obj.globeBackground = obj.g.append("circle")
            .attr("cx", obj.width / 2).attr("cy", obj.height / 2)
            .attr("r", obj.projection.scale())
            .attr("class", "noclicks")
            .style("fill", "url(#ocean_fill)");

      var ocean_fill = obj.svg.append("defs").append("radialGradient")
              .attr("id", "ocean_fill")
              .attr("cx", "75%")
              .attr("cy", "25%");
          ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#cce");
          ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#9ab");
    }

    obj.resetMapElements = function() {
        obj.resetLabelVisibility();
        obj.g.selectAll(".country-borders").style("stroke-width", obj.getBorderStrokeWidth());
        obj.g.selectAll(".graticule-path").style("stroke-width", obj.getGraticuleStrokeWidth());
    }

    obj.zoomPlanar = function() {
        obj.setMapTransform(obj.zoom.translate(), obj.zoom.scale());
        obj.resetMapElements();
    }

    obj.getLabelPosition = function(feature) {
        var objCenter = feature.properties.centroid || feature;
        var point = obj.path.centroid(objCenter);
        if (!point || isNaN(point[0])) {
            return null;
        }
        return point;
    }

    obj.zoomNonPlanar = function() {
        var start = Date.now();
        obj.globeBackground.attr("r", obj.zoom.scale())

        for (var i = 0; i < obj.labels.length; i++) {
            obj.entities[i].borders.attr("d", obj.path);
            //TODO: only draw at the end of the zoom
            obj.labels[i].setPosition(obj.getLabelPosition(obj.labels[i].entity.feature));
        }

        console.log("Done borders " + (Date.now() - start) + " ms");
        obj.g.selectAll(".graticule-path").attr("d", obj.path);

        obj.resetLabelVisibility();
    }

    obj.increaseMapFontSize = function() {
        if (obj.mapFontSize < 48) {
            obj.mapFontSize *= obj.FONT_SIZE_INCREMENT;
        }
        obj.resetLabelVisibility();
    }

    obj.decreaseMapFontSize = function() {
        if (obj.mapFontSize > 7) {
            obj.mapFontSize /= obj.FONT_SIZE_INCREMENT;
        }
        obj.resetLabelVisibility();
    }

    obj.getFontSize = function() {
        return (obj.mapFontSize / obj.getScale()) + "px";
    }

    obj.setFontSize = function(fontSize) {
        obj.mapFontSize = fontSize;
        obj.resetLabelVisibility();
    }

    obj.getBorderStrokeWidth = function() {
        return (0.1 / obj.getScale());
    }

    obj.getSelectedBorderStrokeWidth = function() {
        return obj.getBorderStrokeWidth() * 8;
    }

    obj.getGraticuleStrokeWidth = function() {
        return (0.5 / obj.getScale());
    }

    return obj;
}

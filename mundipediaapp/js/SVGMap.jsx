import {Dispatchable} from "../../stemjs/src/base/Dispatcher";
import {UI, SVG, Select, Button, StyleSheet, styleRule, Theme, TextInput, registerStyle, CheckboxInput} from "ui/UI";
import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import D3PathString from "d3-geo/src/path/string";
import {FAIcon} from "FontAwesome";
import {getDragPointRotation} from "./geo/Transform";

import {Draggable} from "ui/Draggable";
import {Zoomable} from "ui/Zoomable";


D3PathString.prototype.point = function (x, y) {
    switch (this._point) {
        case 0: {
            this._string.push("M" + x.toFixed(3) + "," + y.toFixed(3));
            this._point = 1;
            break;
        }
        case 1: {
            this._string.push("L" + x.toFixed(3) + "," + y.toFixed(3));
            break;
        }
        default: {
            if (this._circle == null) this._circle = circle(this._radius);
            this._string.push("M", x, ",", y, this._circle);
            break;
        }
    }
};

class FeatureStyle extends StyleSheet {
    @styleRule
    featureBorder = {
        strokeWidth: 0,
        ":hover": {
            stroke: "white",
            strokeWidth: 1,
        }
    }
}

function hashToColor(hash) {
    function hashCode(str, hash=0) {
        hash = hash ^ 431;

        for (let i = 0, len = str.length; i < len; i++) {
            hash  = hash + ((hash << 5) ^ (hash >> 20)) + str.charCodeAt(i);
            hash |= 0;
        }
        hash = Math.abs(hash);

        return hash;
    }

    hash = String(hash || Math.random());
    let letters = "6789ABCD".split("");
    let color = "#";

    for (let i = 0; i < 3; i++ ) {
        let index = hashCode(hash, 100 * i) % letters.length;
        color += letters[index];
    }
    return color;
}

@registerStyle(FeatureStyle)
class FeaturePath extends SVG.Path {
    getDefaultOptions(options) {
        return {
            className: this.styleSheet.featureBorder,
            fill: options.fill || this.getFeatureFill(),
        }
    }

    getFeatureFill() {
        const {feature} = this.options;
        const id = feature.properties.entity_id || feature.properties.name || feature.properties.ctr_name;
        return hashToColor(id);
    }

    onMount() {
        this.addNodeListener("mouseenter", () => this.toFront());
    }
}

export class HistoricalMap extends Zoomable(Draggable(SVG.SVGRoot)) {
    getDefaultOptions(options) {
        options = Object.assign({
            height: 600,
            width: 800,
            showGraticule: true,

        }, options);

        const VIEW_BOX_SIZE = Math.min(options.height, options.width);

        options = Object.assign({
            initialScale: 0.5 * VIEW_BOX_SIZE,
            initialTranslate: [options.width / 2, options.height / 2],
            initialRotation: [0, 0, 0],
        }, options);


        options.projection = options.projection || geoOrthographic().scale(options.initialScale).clipAngle(90).translate(options.initialTranslate);

        return options;
    }

    setData(data) {
        this.data = data;
        this.redraw();
    }

    getProjection() {
        return this.options.projection;
    }

    setProjection(projection) {
        const oldProjection = this.getProjection();
        projection.scale(oldProjection.scale());
        projection.translate(oldProjection.translate());
        projection.rotate(oldProjection.rotate());
        this.options.projection = projection;
        this.redraw();
    }

    resetProjection() {
        this.getProjection().scale(this.options.initialScale).translate(this.options.initialTranslate).rotate(this.options.initialRotation);
        this.redraw();
    }

    setShowGraticule(value) {
        this.updateOptions({showGraticule: value});
    }

    getPathMaker() {
        return geoPath(this.getProjection());
    }

    makePath(geometry) {
        return this.getPathMaker()(geometry);
    }

    getGraticule() {
        if (this.options.showGraticule) {
            const graticule = geoGraticule().step([20, 10])();
            return <SVG.Path fill="none" stroke="#aaa" strokeWidth={0.5} d={this.makePath(graticule)} />;
        }
    }

    setDimensions(dimensions) {
        console.log(dimensions.height, dimensions.width);
    }

    render() {
        if (!this.data) {
            return [];
        }

        let paths = this.data.features.map((feature) => {
            const path = this.makePath(feature.geometry);
            if (!path) {
                return null;
            }

            return <FeaturePath feature={feature} d={path}/>;
        });

        return [<SVG.Group>
                {paths}
            </SVG.Group>,
            this.getGraticule(),
        ];
    }

    getProjectionCoordinates(point=this.getMouseCoordinatesForEvent()) {
        return this.getProjection().invert([point.x, point.y]);
    }

    handleDragStart(event) {
        this._dragStartPoint = this.getProjectionCoordinates();
        //this.options.drawMode = DrawMode.SIMPLIFIED;
    }

    handleDrag() {
        const projection = this.getProjection();
        const currentPoint = this.getProjectionCoordinates();

        // const currentTranslation = projection.translate();
        // const currentScale = projection.scale();
        // console.log("Current scale", currentScale);
        //
        // const newTranslation = [0, 0];
        // for (let i = 0; i < 2; i++) {
        //     // vertical is mirrored, using obscuring formula (you know, for the kids)
        //     newTranslation[i] = currentTranslation[i] + (currentPoint[i] - this._dragStartPoint[i]) * (1 - 2 * i);
        // }
        //
        // projection.translate(newTranslation);

        const currentRotation = projection.rotate();
        const newRotation = getDragPointRotation(this._dragStartPoint, currentPoint, currentRotation);

        projection.rotate(newRotation);

        this.redraw();
    }

    handleDragEnd() {
    }

    onMount() {
        this.addDragListener({
            onStart: (event) => this.handleDragStart(),
            onDrag: (deltaX, deltaY, event) => this.handleDrag(),
            onEnd: (event) => this.handleDragEnd(),
        });

        this.addZoomListener((zoomEvent) => {
            const projection = this.getProjection();
            projection.scale(projection.scale() * zoomEvent.zoomFactor);
            this.redraw();
        });

        window.addEventListener("resize", () => {
            this.setDimensions(getPreferredDimensions());
        });
    }
}

import {UI, SVG, StyleSheet, styleRule, registerStyle} from "ui/UI";
import {geoPath, geoOrthographic, geoGraticule} from "d3-geo";
import {getDragPointRotation} from "./geo/Transform";

import {Draggable} from "ui/Draggable";
import {Zoomable} from "ui/Zoomable";
import {CallThrottler} from "../../stemjs/src/base/Utils";


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
    let letters = "56789ABC".split("");
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

    getMap() {
        return this.options.map;
    }

    dispatchFeatureToMap(type) {
        const map = this.getMap();
        map && map.dispatch(type, this.options.feature, this);
    }

    onMount() {
        this.addNodeListener("mouseenter", () => {
            this.toFront();
            this.dispatchFeatureToMap("mouseEnterFeature");
        });
        this.addNodeListener("mouseleave", () => {
            this.dispatchFeatureToMap("mouseLeaveFeature");
        });
    }
}

export class SVGMap extends Zoomable(Draggable(SVG.SVGRoot)) {
    simpleRedrawThrottler = new CallThrottler({throttle: CallThrottler.ON_ANIMATION_FRAME});
    fullRedrawThrottler = new CallThrottler({debounce: 500});

    getDefaultOptions(options) {
        options = Object.assign({
            width: 800,
            height: 600,
            showGraticule: true,
            geometryGetter: (feature) => feature.geometry,
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

    extraNodeAttributes(attr) {
        attr.setStyle({
            background: "transparent",
        })
    }

    setData(data) {
        this.data = data;
        this.redraw();
    }

    getPrecisionLevel() {
        return this.options.precisionLevel;
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
        this.getProjection().precision(Math.sqrt(0.5));
        if (this.options.showGraticule) {
            const graticule = geoGraticule().step([20, 10])();
            return <SVG.Path fill="none" stroke="#aaa" strokeWidth={0.5} d={this.makePath(graticule)} />;
        }
    }

    setDimensions(dimensions) {
        console.log(dimensions.height, dimensions.width);
    }

    getGeometry(feature) {
        return this.options.geometryGetter(feature, this);
    }

    render() {
        if (!this.data) {
            return [];
        }

        let paths = this.data.features.map((feature) => {
            const geometry = this.getGeometry(feature);
            const path = geometry && this.makePath(geometry);
            if (!path) {
                return null;
            }

            return <FeaturePath feature={feature} d={path} map={this} />;
        });

        return [
            <SVG.Group>
                <SVG.Path fill="#cef" d={this.makePath({type: "Sphere"})} />
                {paths}
            </SVG.Group>,
            this.getGraticule(),
        ];
    }

    getProjectionCoordinates(point=this.getMouseCoordinatesForEvent()) {
        return this.getProjection().invert([point.x, point.y]);
    }

    redrawSimplified() {
        this.simpleRedrawThrottler.call(() => {
            this.options.isDragging = true;
            this.getProjection().precision(5);
            this.redraw();
        });
        this.fullRedrawThrottler.call(() => {
            this.options.isDragging = false;
            this.getProjection().precision(Math.sqrt(0.5));
            this.redraw();
        });
    }

    handleDragStart(event) {
        this._dragStartPoint = this.getProjectionCoordinates();
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

        this.redrawSimplified();
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
            this.redrawSimplified();
        });
    }

    // let rotate = () => {
    //     this.getProjection().rotate([Date.now() / 200, 0, 0]);
    //     this.redraw();
    //     requestAnimationFrame(rotate);
    // };
    // rotate();
}

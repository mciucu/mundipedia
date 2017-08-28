import {Dispatchable} from "../../stemjs/src/base/Dispatcher";
import {UI, SVG, Select, Button, StyleSheet, styleRule, Theme, TextInput, registerStyle} from "ui/UI";
import {Ajax} from "base/Ajax";
import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import D3PathString from "d3-geo/src/path/string";
import {TeamSection} from "./Team";
import {FAIcon} from "FontAwesome";

import {Draggable} from "ui/Draggable";

const Zoomable = (BaseClass) => class Zoomable extends BaseClass {
    getZoomLevel() {
        return this.options.zoomLevel || 1;
    }

    getMinZoomLevel() {
        return this.options.minZoomLevel || 0.02;
    }

    getMaxZoomLevel() {
        return this.options.maxZoomLevel || 50;
    }

    setZoomLevel(zoomLevel, event) {
        zoomLevel = Math.max(this.getMinZoomLevel(), zoomLevel);
        zoomLevel = Math.min(this.getMaxZoomLevel(), zoomLevel);
        if (this.getZoomLevel() === zoomLevel) {
            return;
        }
        this.options.zoomLevel = zoomLevel;
        this.redraw();
        this.dispatch("setZoomLevel", zoomLevel);
    }

    addZoomListener(callback) {

    }
};

/***** ALL MATH FUNCTIONS ****/

// The following code is from ivyywang

var to_radians = Math.PI / 180;
var to_degrees = 180 / Math.PI;


// Helper function: cross product of two vectors v0&v1
function cross(v0, v1) {
    return [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
}

//Helper function: dot product of two vectors v0&v1
function dot(v0, v1) {
    for (var i = 0, sum = 0; v0.length > i; ++i) sum += v0[i] * v1[i];
    return sum;
}

// Helper function:
// This function converts a [lon, lat] coordinates into a [x,y,z] coordinate
// the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
function lonlat2xyz( coord ){

	var lon = coord[0] * to_radians;
	var lat = coord[1] * to_radians;

	var x = Math.cos(lat) * Math.cos(lon);

	var y = Math.cos(lat) * Math.sin(lon);

	var z = Math.sin(lat);

	return [x, y, z];
}

// Helper function:
// This function computes a quaternion representation for the rotation between to vectors
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quaternion(v0, v1) {

	if (v0 && v1) {

	    var w = cross(v0, v1),  // vector pendicular to v0 & v1
	        w_len = Math.sqrt(dot(w, w)); // length of w

        if (w_len == 0)
        	return;

        var theta = .5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))),

	        qi  = w[2] * Math.sin(theta) / w_len,
            qj  = - w[1] * Math.sin(theta) / w_len,
            qk  = w[0]* Math.sin(theta) / w_len,
            qr  = Math.cos(theta);

	    return theta && [qr, qi, qj, qk];
	}
}

// Helper function:
// This functions converts euler angles to quaternion
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function euler2quat(e) {

	if (!e) return;

    var roll = .5 * e[0] * to_radians,
        pitch = .5 * e[1] * to_radians,
        yaw = .5 * e[2] * to_radians,

        sr = Math.sin(roll),
        cr = Math.cos(roll),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        sy = Math.sin(yaw),
        cy = Math.cos(yaw),

        qi = sr*cp*cy - cr*sp*sy,
        qj = cr*sp*cy + sr*cp*sy,
        qk = cr*cp*sy - sr*sp*cy,
        qr = cr*cp*cy + sr*sp*sy;

    return [qr, qi, qj, qk];
}

// This functions computes a quaternion multiply
// Geometrically, it means combining two quant rotations
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
function quatMultiply(q1, q2) {
	if(!q1 || !q2) return;

    var a = q1[0],
        b = q1[1],
        c = q1[2],
        d = q1[3],
        e = q2[0],
        f = q2[1],
        g = q2[2],
        h = q2[3];

    return [
     a*e - b*f - c*g - d*h,
     b*e + a*f + c*h - d*g,
     a*g - b*h + c*e + d*f,
     a*h + b*g - c*f + d*e];

}

// This function computes quaternion to euler angles
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quat2euler(t){

	if(!t) return;

	return [ Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * to_degrees,
			 Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * to_degrees,
			 Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * to_degrees
			]
}

/*  This function computes the euler angles when given two vectors, and a rotation
	This is really the only math function called with d3 code.

	v0 - starting pos in lon/lat, commonly obtained by projection.invert
	v1 - ending pos in lon/lat, commonly obtained by projection.invert
	o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
*/

function eulerAngles(v0, v1, o0) {

	/*
		The math behind this:
		- first calculate the quaternion rotation between the two vectors, v0 & v1
		- then multiply this rotation onto the original rotation at v0
		- finally convert the resulted quat angle back to euler angles for d3 to rotate
	*/

	var t = quatMultiply( euler2quat(o0), quaternion(lonlat2xyz(v0), lonlat2xyz(v1) ) );
	return quat2euler(t);
}


/**************end of math functions**********************/


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

class Entity extends Dispatchable {
    constructor(obj) {
        super();
        Object.assign(this, obj);
    }
}

export class SVGMap extends SVG.SVGRoot {
    getDefaultOptions() {
        return {
            height: 480,
            width: 800
        }
    }

    getProjection() {
        return this.options.projection;
    }
}

export class HistoricalMap extends Draggable(SVGMap) {
    setData(data) {
        this.data = data;
        this.redraw();
    }

    getCurrentYear() {
        return this.options.currentYear || 1899;
    }

    setCurrentYear(currentYear) {
        this.options.currentYear = currentYear;
        this.loadCurrentYearData();
    }

    loadCurrentYearData() {
        const fileName = "/static/json/world/" + this.getCurrentYear() + "-sm.json";
        Ajax.getJSON(fileName).then(data => this.setData(data));
    }

    getProjection() {
        if (!this.options.projection) {
            const VIEW_BOX_SIZE = 600;
            this.options.projection = geoOrthographic().scale(0.5 * VIEW_BOX_SIZE).clipAngle(90).translate([VIEW_BOX_SIZE / 2, VIEW_BOX_SIZE / 2]);
        }
        return this.options.projection;
    }

    getPathMaker() {
        if (!this.options.pathMaker) {
            this.options.pathMaker = geoPath(this.getProjection());
        }
        return this.options.pathMaker;
    }

    makePath(geometry) {
        return this.getPathMaker()(geometry);
    }

    getGraticule() {
        const graticule = geoGraticule().step([20, 10])();
        return <SVG.Path fill="none" stroke="cornflowerblue" strokeWidth={1} strokeDasharray="1,1" d={this.makePath(graticule)} />
    }

    setProjection(projection) {
        console.log("Set projection to ", projection);
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
            return <SVG.Path strokeWidth={1} stroke="#ddd" fill="#ccc" d={path} />;
        });

        paths.push(this.getGraticule());

        return paths;
    }

    onMount() {
        this.loadCurrentYearData();

        const pointToArray = (point) => [point.x, point.y];

        let gpos0, o0;

        this.addDragListener({
            onStart: (event) => {
                let projection = this.getProjection();
                gpos0 = projection.invert(pointToArray(this.getMouseCoordinates(event)));
            },
            onDrag: (deltaX, deltaY, event) => {
                const projection = this.getProjection();

                let gpos1 = projection.invert(pointToArray(this.getMouseCoordinates(event)));
                o0 = projection.rotate();

                let o1 = eulerAngles(gpos0, gpos1, o0);
                projection.rotate(o1);

                this.redraw();
            },
            onEnd: (event) => {
            },
        });

        this.addNodeListener("wheel", (event) => {
            let projection = this.getProjection();
            let currentScale = projection.scale();
            let deltaY = -event.deltaY;
            const scaleRatio = (deltaY >= 0) ? 1 + deltaY / 200 : 1 / (1 - deltaY / 200);
            this.getProjection().scale(currentScale * scaleRatio);
            this.redraw();
        })
    }
}

class FlatSelectStyle extends StyleSheet {
    height = 40;
    width = 160;

    @styleRule
    flatSelect = {
        width: this.width,
        height: this.height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    };

    @styleRule
    button = {
        height: this.height,
        width: this.width / 4,
        backgroundColor: "#fff",
        border: "0",
        ":hover": {
            backgroundColor: "#fff",
            color: Theme.Global.properties.COLOR_PRIMARY,
        },
        ":active": {
            backgroundColor: "#fff",
        },
        ":focus": {
            backgroundColor: "#fff",
        },
        ":active:focus": {
            backgroundColor: "#fff",
        }
    };

    @styleRule
    textInput = {
        height: this.height,
        width: this.width / 2,
        fontSize: "18px",
        textAlign: "center",
        border: "0",
        outline: "none",
        borderBottom: "2px solid #000",
        ":active": {
            borderBottom: "2px solid " + Theme.Global.properties.COLOR_PRIMARY,
            color: Theme.Global.properties.COLOR_PRIMARY,
        },
        ":focus": {
            borderBottom: "2px solid " + Theme.Global.properties.COLOR_PRIMARY,
            color: Theme.Global.properties.COLOR_PRIMARY,
        },
    };
}


@registerStyle(FlatSelectStyle)
class FlatSelect extends UI.Element {
    setOptions(options) {
        this.currentValue = options.values[0];
        super.setOptions(options);
    }

    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.flatSelect);
    }

    addChangeListener(callback) {
        return this.addListener("change", callback);
    }

    getCurrentValue() {
        return this.currentValue;
    }

    setCurrentValue(value) {
        this.currentValue = value;
        this.redraw();
        this.dispatch("change");
    }

    getFromArrow(direction) {
        let {values} = this.options;

        let currentIndex = values.indexOf(this.getCurrentValue());
        let nextIndex = currentIndex + direction;
        if (!(nextIndex >= 0 && nextIndex < values.length)) {
            return;
        }

        this.setCurrentValue(values[nextIndex]);
    }

    getFromInput(enteredValue) {
        let {values} = this.options;
        let valuesFiltered;

        valuesFiltered = values.filter((value) => {
            return value <= enteredValue;
        });
        this.setCurrentValue(valuesFiltered[valuesFiltered.length - 1] || values[0]);
    }

    render() {
        return [
            <Button className={this.styleSheet.button} onClick={() => this.getFromArrow(-1)}>
                <FAIcon icon="arrow-left"/>
            </Button>,
            <TextInput ref="textInput" className={this.styleSheet.textInput} value={this.getCurrentValue()} />,
            <Button className={this.styleSheet.button} onClick={() => this.getFromArrow(1)}>
                <FAIcon icon="arrow-right"/>
            </Button>,
        ];
    }

    onMount() {
        this.textInput.addNodeListener("keypress", (event) => {
            if (event.keyCode === 13) { // 'Enter' was pressed
                this.getFromInput(this.textInput.getValue());
                this.redraw();
            }
        });
    }
}


export class HistoricalWorldMap extends UI.Element {
    getAvailableProjections() {
        return ["Mercator", "Echart", "Spherical"];
    }

    render() {
        return [
            <div style={{width: "100%", height: "5px", marginTop: "800px"}} />,
            <TeamSection />,
            <div style={{
                width: "100%",
                height: "50px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "50px",
            }}>
                <FlatSelect values={self.WORLD_MAP_YEARS} ref="yearSelect"/>
            </div>,
            <HistoricalMap ref="map" />
        ]
    }

    setProjection(projection) {
        this.map.setProjection(projection);
    }

    onMount() {
        this.yearSelect.addChangeListener(() => {
            this.map.setCurrentYear(this.yearSelect.getCurrentValue());
        });
    }
}

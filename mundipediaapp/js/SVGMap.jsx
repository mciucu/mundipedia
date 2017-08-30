import {Dispatchable} from "../../stemjs/src/base/Dispatcher";
import {UI, SVG, Select, Button, StyleSheet, styleRule, Theme, TextInput, registerStyle} from "ui/UI";
import {Ajax} from "base/Ajax";
import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import {geoEckert4, geoHammer} from "d3-geo-projection/index";
import D3PathString from "d3-geo/src/path/string";
import {FAIcon} from "FontAwesome";
import {enhance} from "Color";

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

class Feature extends Dispatchable {
    constructor(obj) {
        super();
        Object.assign(this, obj);
    }
}

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

function getPreferredDimensions() {
    const themeProperties = Theme.Global.getProperties();

    return {
        height: window.innerHeight - (themeProperties.NAV_MANAGER_NAVBAR_HEIGHT + themeProperties.GLOBAL_YEAR_SELECT_HEIGHT),
        width: window.innerWidth,
    };
}

export class HistoricalMap extends Draggable(SVG.SVGRoot) {
    getDefaultOptions(options) {
        options = Object.assign(getPreferredDimensions(), options);

        const VIEW_BOX_SIZE = Math.min(options.height, options.width);

        options.projection = options.projection || geoOrthographic().scale(0.5 * VIEW_BOX_SIZE).clipAngle(90).translate([VIEW_BOX_SIZE / 2, VIEW_BOX_SIZE / 2]);

        return options;
    }

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
        return this.options.projection;
    }

    setProjection(projection) {
        const oldProjection = this.getProjection();
        projection.clipAngle(oldProjection.clipAngle());
        projection.scale(oldProjection.scale());
        projection.translate(oldProjection.translate());
        projection.rotate(oldProjection.rotate());
        this.options.projection = projection;
        this.redraw();
    }

    resetProjection() {
        console.log("reset projection");
    }

    getPathMaker() {
        return geoPath(this.getProjection());
    }

    makePath(geometry) {
        return this.getPathMaker()(geometry);
    }

    getGraticule() {
        const graticule = geoGraticule().step([20, 10])();
        return <SVG.Path fill="none" stroke="cornflowerblue" strokeWidth={1} strokeDasharray="1,1" d={this.makePath(graticule)} />
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

        paths.push(this.getGraticule());

        return [
            <SVG.Group>
                {paths}
            </SVG.Group>,
            this.getGraticule(),
        ];
    }

    setDimensions(dimensions) {
        console.log(dimensions.height, dimensions.width);
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
        });

        window.addEventListener("resize", () => {
            this.setDimensions(getPreferredDimensions());
        });
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
        transition: "0.15s",
        ":hover": {
            backgroundColor: "#fff",
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":active": {
            backgroundColor: "#fff",
            transition: "0.15s",
        },
        ":focus": {
            backgroundColor: "#fff",
            transition: "0.15s",
        },
        ":active:focus": {
            backgroundColor: "#fff",
            transition: "0.15s",
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
        transition: "0.15s",
        ":hover": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":active": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
        },
        ":focus": {
            borderBottom: "2px solid " + this.themeProperties.COLOR_PRIMARY,
            color: this.themeProperties.COLOR_PRIMARY,
            transition: "0.15s",
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

class HistoricalWorldMapTitle extends UI.Element {
    setCurrentYear(currentYear) {
        this.options.currentYear = currentYear;
        this.redraw();
    }

    getYearsInterval(currentYear) {
        const {years} = this.options;
        const yearsFiltered = years.filter((value) => {
            return value < currentYear;
        });
        const previousYearWithData = (yearsFiltered[yearsFiltered.length - 1] || years[0] - 1);

        if (previousYearWithData + 1 === currentYear) {
            return ` in ${currentYear}`;
        } else {
            return `between ${previousYearWithData + 1}-${currentYear}`;
        }
    }

    render() {
        return (
            <div>
                Geopolitical map of the world {this.getYearsInterval(this.options.currentYear)}
            </div>
        );
    }
}

class HistoricalWorldMapStyle extends StyleSheet {
    menuWidth = 240;
    menuExtraPaddingVertical = 10;
    menuExtraPaddingHorizontal = 20;
    boxShadowWidth = 5;

    @styleRule
    container = {
        width: "1200px",
        maxWidth: "100%",
        paddingLeft: "20px",
        paddingRight: "20px",
    };

    @styleRule
    yearSelectContainer = {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "10px",
        marginBottom: "10px",
        flexDirection: "row",
    };

    @styleRule
    historyWorldMapTitle = {
        textAlign: "center",
        fontSize: "22px",
    };

    @styleRule
    menuContainer = {
        paddingTop: this.themeProperties.NAV_MANAGER_NAVBAR_HEIGHT + this.menuExtraPaddingVertical,
        backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, 0.3),
        boxShadow: this.themeProperties.BASE_BOX_SHADOW,
        width: this.menuWidth,
        height: "100%",
        position: "fixed",
        left: "0",
        display: "flex",
        justifyContent: "center",

    };

    @styleRule
    menuToggled = {
        left: "0",
        transitionDuration: "0.15s",
    };

    @styleRule
    menuUntoggled = {
        left: `-${this.menuWidth + this.boxShadowWidth}px`,
        transitionDuration: "0.15s",
    };

    @styleRule
    toggleOptions = {
        padding: `${this.menuExtraPaddingVertical}px ${this.menuExtraPaddingHorizontal}px`,
        backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, 0.3),
        fontSize: "22px !important",
        transition: "0.2s",
        cursor: "pointer",
        color: "#fff",
        position: "fixed",
        top: this.themeProperties.NAV_MANAGER_NAVBAR_HEIGHT,
        left: 0,
        width: this.menuWidth,
        display: "flex",
        justifyContent: "space-between",

        ":hover": {
            backgroundColor: this.themeProperties.COLOR_PRIMARY,
            color: "#fff",
            transition: "0.15s",
        },
    };

    @styleRule
    menuIcon = {
        display: "flex !important",
        alignItems: "center",
        justifyContent: "center",
    };
}

@registerStyle(HistoricalWorldMapStyle)
export class HistoricalWorldMap extends UI.Element {
    constructor(options) {
        super(options);
        this.menuIsToggled = false;
    }

    getDefaultOptions() {
        return {
            currentYear: self.WORLD_MAP_YEARS[0],
        }
    }

    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.container);
    }

    getAvailableProjections() {
        function makeProjection(d3Projection, name) {
            const projection = d3Projection();
            projection.toString = () => name;
            return projection;
        }
        return [
            makeProjection(geoOrthographic, "Spherical"),
            makeProjection(geoEckert4, "Eckert 4"),
            makeProjection(geoAzimuthalEqualArea, "Azimuthal Equal Area"),
            makeProjection(geoConicEquidistant, "Conic equidistant"),
            makeProjection(geoHammer, "Hammer"),
        ];
    }

    toggleMenu() {
        if (this.menuIsToggled) {
            this.menu.removeClass(this.styleSheet.menuToggled);
            this.menu.addClass(this.styleSheet.menuUntoggled);
        } else {
            this.menu.removeClass(this.styleSheet.menuUntoggled);
            this.menu.addClass(this.styleSheet.menuToggled);
        }
        this.menuIsToggled = !this.menuIsToggled;
        this.menuIcon.setChildren([this.getMenuLabel()]);
    }

    getMenuLabel() {
        if (this.menuIsToggled) {
            return [
                "Less map options",
                <FAIcon icon="angle-double-left" className={this.styleSheet.menuIcon} />,
            ];
        }
        return [
            "More map options",
            <FAIcon icon="angle-double-right" className={this.styleSheet.menuIcon} />,
        ];
    }

    render() {
        const {currentYear} = this.options;

        return [
            <div ref="menu" className={this.styleSheet.menuContainer + this.styleSheet.menuUntoggled}>
                <Select options={this.getAvailableProjections()}
                        ref="projectionSelect"
                        onChange={(obj) => this.setProjection(obj.get())}
                />
            </div>,
            <div ref="menuIcon" className={this.styleSheet.toggleOptions}>
                {this.getMenuLabel()}
            </div>,
            <div className={this.styleSheet.yearSelectContainer}>
                {/*<FAIcon ref="menuIcon" icon="bars" className={this.styleSheet.menuIcon} />,*/}
                {/*<HistoricalWorldMapTitle ref="title"*/}
                                     {/*years={self.WORLD_MAP_YEARS}*/}
                                     {/*currentYear={currentYear}*/}
                                     {/*className={this.styleSheet.historyWorldMapTitle} />*/}
                <FlatSelect values={self.WORLD_MAP_YEARS} value={currentYear} ref="yearSelect"/>
            </div>,
            <HistoricalMap ref="map" />,
        ]
    }

    setProjection(projection) {
        this.map.setProjection(projection);
    }

    setCurrentYear(currentYear) {
        this.options.currentYear = currentYear;
        this.map.setCurrentYear(currentYear);
        this.title.setCurrentYear(currentYear);
    }

    onMount() {
        this.menuIcon.addClickListener((event) => {
            event.stopPropagation();
            this.toggleMenu();
        });

        this.menu.addClickListener((event) => {
            event.stopPropagation();
        });

        this.yearSelect.addChangeListener(() => {
            this.setCurrentYear(this.yearSelect.getCurrentValue());
        });

        document.body.addEventListener("click", () => {
            if (this.menuIsToggled) {
                this.toggleMenu();
            }
        });
    }
}

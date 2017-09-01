import {Dispatchable} from "../../stemjs/src/base/Dispatcher";
import {UI, SVG, Select, Button, StyleSheet, styleRule, Theme, TextInput, registerStyle, CheckboxInput} from "ui/UI";
import {Ajax} from "base/Ajax";
import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import {geoEckert4, geoHammer} from "d3-geo-projection/index";
import D3PathString from "d3-geo/src/path/string";
import {FAIcon} from "FontAwesome";
import {enhance} from "Color";
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

function getPreferredDimensions() {
    const themeProperties = Theme.Global.getProperties();

    return {
        height: window.innerHeight - (themeProperties.NAV_MANAGER_NAVBAR_HEIGHT + themeProperties.GLOBAL_YEAR_SELECT_HEIGHT + 25),
        width: window.innerWidth,
    };
}

export class HistoricalMap extends Zoomable(Draggable(SVG.SVGRoot)) {
    getDefaultOptions(options) {
        options = Object.assign(getPreferredDimensions(), {
            showGraticule: true,
        }, options);

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
        projection.scale(oldProjection.scale());
        projection.translate(oldProjection.translate());
        projection.rotate(oldProjection.rotate());
        this.options.projection = projection;
        this.redraw();
    }

    resetProjection() {
        console.log("reset projection");
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

    setDimensions(dimensions) {
        console.log(dimensions.height, dimensions.width);
    }

    onMount() {
        this.loadCurrentYearData();

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
        // width: "1200px",
        width: "100%",
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
        alignItems: "center",
        flexDirection: "column",
        ">*": {
            userSelect: "none",
        }
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

    @styleRule
    select = {
        backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, -0.2),
        border: "0",
        borderRadius: "0",
        color: "#fff",
        transition: "0.15s",
        ":hover": {
            backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, -0.3),
            transition: "0.15s",
        },
    };

    @styleRule
    button = {
        marginTop: "20px",
        backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, -0.2),
        padding: "10px 20px",
        color: "#fff",
        cursor: "pointer",
        transition: "0.15s",
        borderRadius: "5px",
        ":hover": {
            backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, -0.3),
            transition: "0.15s",
        },
    };
}

@registerStyle(HistoricalWorldMapStyle)
export class HistoricalWorldMap extends UI.Element {
    constructor(options) {
        super(options);
        this.menuIsToggled = false;
        this.graticuleIsToggled = true;
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
            const projection = d3Projection().clipAngle(90);
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

    getGraticuleLabel() {
        if (this.graticuleIsToggled) {
            return "Hide graticule";
        }
        return "Show graticule";
    }

    render() {
        const {currentYear} = this.options;

        return [
            <div ref="menu" className={this.styleSheet.menuContainer + this.styleSheet.menuUntoggled}>
                <Select options={this.getAvailableProjections()}
                        ref="projectionSelect"
                        onChange={(obj) => this.setProjection(obj.get())}
                        className={this.styleSheet.select}
                />
                <div className={this.styleSheet.button} onClick={() => this.map.resetProjection()}>
                    Reset projection
                </div>
                <div className={this.styleSheet.button} ref="drawGraticuleContainer">
                    {this.getGraticuleLabel()}
                </div>
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

        this.drawGraticuleContainer.addClickListener(() => {
            this.graticuleIsToggled = !this.graticuleIsToggled;
            this.map.setShowGraticule(this.graticuleIsToggled);
            this.drawGraticuleContainer.setChildren([this.getGraticuleLabel()]);
        });

        document.body.addEventListener("click", () => {
            if (this.menuIsToggled) {
                this.toggleMenu();
            }
        });
    }
}

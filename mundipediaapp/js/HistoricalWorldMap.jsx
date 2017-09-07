import {UI, StyleSheet, styleRule, registerStyle, Select, Theme} from "UI";
import {Ajax} from "base/Ajax";

import {enhance} from "Color";
import {FAIcon} from "FontAwesome";

import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import {geoEckert4, geoHammer} from "d3-geo-projection/index";

import {YearSelect} from "./YearSelect";
import {SVGMap} from "./SVGMap";
import {UnorderedCallDropper} from "base/Utils";


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
            return ` in ${previousYearWithData + 1}-${currentYear}`;
        }
    }

    render() {
        return (
            <div>
                Map of the world {this.getYearsInterval(this.options.currentYear)}
            </div>
        );
    }
}


class HistoricalWorldMapStyle extends StyleSheet {
    constructor() {
        super({
            updateOnResize: true
        });
    }

    resizeWidthLimit = 720;
    menuWidth = 240;
    menuExtraPaddingVertical = 10;
    menuExtraPaddingHorizontal = 20;
    toggleOptionsHeight = 50;
    toggleOptionsMobileHeight = 35;
    toggleOptionsFontSize = 22;
    toggleOptionsMobileFontSize = 18;
    boxShadowWidth = 5;

    getYearSelectContainerWidth() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return `calc(100% - ${this.menuWidth})`;
        }
        return "100%";
    }

    getYearSelectContainerMarginTop() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return 5;
        }
        return `${this.getToggleOptionsHeight()}px`;
    }

    getYearSelectContainerMarginBottom() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return 15;
        }
        return 0;
    }

    getYearSelectContainerPaddingLeft() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return this.menuWidth;
        }
        return this.menuExtraPaddingHorizontal;
    }

    getToggleOptionsHeight() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return this.toggleOptionsHeight;
        }
        return this.toggleOptionsMobileHeight;
    }

    getToggleOptionsFontSize() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return this.toggleOptionsFontSize;
        }
        return this.toggleOptionsMobileFontSize;
    }

    @styleRule
    container = {
        // width: "1200px",
        width: "100%",
    };

    @styleRule
    yearSelectContainer = {
        width: "100%",
        marginTop: this.getYearSelectContainerMarginTop(),
        paddingLeft: this.getYearSelectContainerPaddingLeft(),
        paddingRight: this.menuExtraPaddingHorizontal,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: this.getYearSelectContainerMarginBottom(),
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
        height: this.getToggleOptionsHeight(),
        padding: `0 ${this.menuExtraPaddingHorizontal}px`,
        backgroundColor: enhance(this.themeProperties.COLOR_PRIMARY, 0.3),
        fontSize: this.getToggleOptionsFontSize() + "px !important",
        transition: "0.2s",
        cursor: "pointer",
        color: "#fff",
        position: "fixed",
        top: this.themeProperties.NAV_MANAGER_NAVBAR_HEIGHT,
        left: 0,
        width: this.menuWidth,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",

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


function getPreferredDimensions() {
    const themeProperties = Theme.Global.getProperties();

    return {
        height: window.innerHeight - (themeProperties.NAV_MANAGER_NAVBAR_HEIGHT + themeProperties.GLOBAL_YEAR_SELECT_HEIGHT + 25),
        width: window.innerWidth,
    };
}

class FeatureAreaStyle extends StyleSheet {
    constructor() {
        super({
            updateOnResize: true,
        })

    }
    height = 45;
    items = 2;

    getDisplay() {
        if (window.innerWidth >= 500) {
            return "block";
        }
        return "none";
    }

    @styleRule
    featureArea = {
        display: this.getDisplay(),
        borderRadius: "3px",
        position: "absolute",
        backgroundColor: "rgba(40, 70, 90, 0.7)",
        color: "#fff",
        top: 110,
        right: 0,
        width: 240,
        pointerEvents: "none",
    };

    @styleRule
    container = {
        height: this.height * this.items,
    };

    @styleRule
    title = {
        justifyContent: "center",
    };

    @styleRule
    row = {
        height: this.height,
        width: "100%",
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
    };
}

@registerStyle(FeatureAreaStyle)
class FeatureArea extends UI.Element {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.featureArea);
    }

    setFeature(feature) {
        this.setOptions({
            feature: feature,
        });
        this.redraw();
    }

    render() {
        const {feature} = this.options;
        const {styleSheet} = this;

        if (!feature || !feature.properties) {
            return null;
        }

        const {name, currency} = feature.properties;

        return <div className={styleSheet.container}>
            <div className={styleSheet.row + styleSheet.title}>
                {name}
            </div>
            {
                currency && (
                    <div className={styleSheet.row}>
                        Currency: {currency}
                    </div>
                )
            }
        </div>;
    }
}


@registerStyle(HistoricalWorldMapStyle)
export class HistoricalWorldMap extends UI.Element {
    requestedYears = new Set(); // TODO: cache which years were loaded, to not request a second time
    geometries = new Map();
    redrawDropper = UnorderedCallDropper.newInstance();

    constructor(options) {
        super(options);
        this.menuIsToggled = false;
        this.graticuleIsToggled = true;
    }

    getDefaultOptions() {
        return {
            currentYear: window.WORLD_MAP_YEARS[0],
        }
    }

    getGeometry(feature, svgMap) {
        let modes = ["", "-sm"];
        const badPrecision = svgMap.options.isDragging;
        if (badPrecision) {
            modes.reverse();
        }
        for (let mode of modes) {
            const key = this.getCurrentYear() + mode + feature.properties.entity_id;
            if (this.geometries.has(key)) {
                return this.geometries.get(key);
            }
        }
        return feature.geometry;
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
        const {currentYear, feature} = this.options;

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
                <YearSelect values={self.WORLD_MAP_YEARS} value={currentYear} ref="yearSelect"/>
                <HistoricalWorldMapTitle ref="title"
                    years={self.WORLD_MAP_YEARS}
                    currentYear={currentYear}
                    className={this.styleSheet.historyWorldMapTitle} />
            </div>,
            <SVGMap
                ref="map"
                geometryGetter={this.getGeometry.bind(this)}
                {...getPreferredDimensions()} />,
            <FeatureArea ref="featureArea" feature={this.options.feature}/>,
        ]
    }

    setProjection(projection) {
        this.map.setProjection(projection);
    }

    setCurrentYear(currentYear) {
        this.options.currentYear = currentYear;
        this.title.setCurrentYear(currentYear);
    }

    getCurrentYear() {
        return this.options.currentYear;
    }

    loadCurrentYearData() {
        const year = this.yearSelect.getCurrentValue();
        const prefix = "/static/json/world/" + year;
        const modes = ["-sm", ""];
        for (const mode of modes) {
            const updateMap = this.redrawDropper((data) => {
                this.setCurrentYear(year);
                this.map.setData(data);
            });
            Ajax.getJSON(prefix + mode + ".json").then((data) => {
                for (let feature of data.features) {
                    const key = year + mode + feature.properties.entity_id;
                    this.geometries.set(key, feature.geometry);
                }
                updateMap(data);
            })
        }
    }

    onMount() {
        this.loadCurrentYearData();

        this.menuIcon.addClickListener((event) => {
            event.stopPropagation();
            this.toggleMenu();
        });

        this.menu.addClickListener((event) => {
            event.stopPropagation();
        });

        this.yearSelect.addChangeListener(() => {
            this.loadCurrentYearData();
        });

        this.drawGraticuleContainer.addClickListener(() => {
            this.graticuleIsToggled = !this.graticuleIsToggled;
            this.map.setShowGraticule(this.graticuleIsToggled);
            this.drawGraticuleContainer.setChildren([this.getGraticuleLabel()]);
        });

        this.map.addListener("mouseEnterFeature", (feature) => {
            console.log("entering", feature);
            this.featureArea.setFeature(feature);
        });

        this.map.addListener("mouseLeaveFeature", (feature) => {
            console.log("leaving", feature);
            this.featureArea.setFeature(null);
        });

        document.body.addEventListener("click", () => {
            if (this.menuIsToggled) {
                this.toggleMenu();
            }
        });

        window.addEventListener("resize", () => {
            console.log("Resize, needs to be handled");
        })
    }
}

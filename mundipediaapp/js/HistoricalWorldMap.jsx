import {UI, StyleSheet, styleRule, registerStyle, Select, Theme} from "UI";
import {Ajax} from "base/Ajax";

import {enhance} from "Color";
import {FAIcon} from "FontAwesome";

import {geoPath, geoOrthographic, geoGraticule, geoConicEquidistant, geoAzimuthalEqualArea} from "d3-geo/index";
import {geoEckert4, geoHammer} from "d3-geo-projection/index";

import {YearSelect} from "./YearSelect";
import {HistoricalMap} from "./SVGMap";


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
        return `${this.toggleOptionsHeight}px`;
    }

    getYearSelectContainerPaddingLeft() {
        if (window.innerWidth >= this.resizeWidthLimit) {
            return this.menuWidth;
        }
        return this.menuExtraPaddingHorizontal;
    }

    @styleRule
    container = {
        // width: "1200px",
        width: "100%",
        background: "#f3f4f5"
    };

    @styleRule
    yearSelectContainer = {
        width: () => this.getYearSelectContainerWidth(),
        marginTop: () => this.getYearSelectContainerMarginTop(),
        paddingLeft: () => this.getYearSelectContainerPaddingLeft(),
        paddingRight: this.menuExtraPaddingHorizontal,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
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
        height: this.toggleOptionsHeight,
        padding: `0 ${this.menuExtraPaddingHorizontal}px`,
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
                <YearSelect values={self.WORLD_MAP_YEARS} value={currentYear} ref="yearSelect"/>
                <HistoricalWorldMapTitle ref="title"
                    years={self.WORLD_MAP_YEARS}
                    currentYear={currentYear}
                    className={this.styleSheet.historyWorldMapTitle} />
            </div>,
            <HistoricalMap ref="map" {...getPreferredDimensions()} />,
        ]
    }

    setProjection(projection) {
        this.map.setProjection(projection);
    }

    setCurrentYear(currentYear) {
        this.options.currentYear = currentYear;
        this.title.setCurrentYear(currentYear);
    }

    loadCurrentYearData() {
        const year = this.yearSelect.getCurrentValue();
        const fileName = "/static/json/world/" + year + "-sm.json";

        Ajax.getJSON(fileName).then(data => {
            this.map.setData(data);

            this.setCurrentYear(this.yearSelect.getCurrentValue());
        });
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

        document.body.addEventListener("click", () => {
            if (this.menuIsToggled) {
                this.toggleMenu();
            }
        });
    }
}

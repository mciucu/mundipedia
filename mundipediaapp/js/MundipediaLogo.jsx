import {UI, SVG} from "ui/UI";
import {StemDate} from "time/Date";
import {geoPath, geoOrthographic} from "d3-geo";
import {geoVoronoi} from "./geo/Voronoi";

export function getPoints(seed, nrPoints=42) {
    let vectors = [];
    seed = seed / 333;
    for (let i = 0; i < nrPoints; i++) {
        vectors.push([(Math.PI * i) % 1, (Math.E * i) % 1]);
        vectors[i][0] = 2.0 * (vectors[i][0] - 0.5);
        vectors[i][1] = (2.0 * (vectors[i][1] - 0.5)) / 2.0;
    }

    function randomPoint(speedU, speedV) {
        const u = Math.abs(seed * speedU) % 360;
        const v = Math.abs(seed * speedV / 180) % 1;
        return [u, 180 * Math.asin(2.0 * v - 1.0)];
    }

    return vectors.map(deltas => randomPoint(deltas[0], deltas[1]));
}


export class MundipediaLogo extends UI.Element {
    static VIEW_BOX_SIZE = 500;

    getDefaultOptions() {
        return {
            framerate: 30,
            stroke: "white",
            fill: "cornflowerblue",
        }
    }

    static getPaths(timestamp) {
        timestamp = timestamp || Date.now();
        if (timestamp == this.cachedTimestamp) {
            return this.cachedPaths;
        }
        this.cachedTimestamp = timestamp;

        const points = getPoints(timestamp);
        const voronoiFeatures = geoVoronoi(points).geometries;

        const VIEW_BOX_SIZE = this.VIEW_BOX_SIZE;

        const projection = geoOrthographic().scale(0.5 * VIEW_BOX_SIZE).clipAngle(90).translate([VIEW_BOX_SIZE / 2, VIEW_BOX_SIZE / 2]);
        const pathMaker = geoPath().projection(projection);

        this.cachedPaths = voronoiFeatures.map(feature => pathMaker(feature));

        return this.cachedPaths;
    }

    render() {
        const size = this.options.size || 300;
        const VIEW_BOX_SIZE = this.constructor.VIEW_BOX_SIZE;

        const paths = this.constructor.getPaths(this.options.timestamp || Date.now());

        return [
            <SVG.SVGRoot height={size} width={size} viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}>
                {paths.map(path => path && <SVG.Path strokeWidth={12} stroke={this.options.stroke} fill={this.options.fill} d={path} />)}
            </SVG.SVGRoot>
        ]
    }

    setTimestamp(timestamp) {
        if (!this.isInDocument()) {
            return;
        }
        this.updateOptions({timestamp});
    }

    onMount() {
        if (this.options.framerate >= 60) {
            let redrawMe = (highResTimestamp) => {
                this.setTimestamp(+StemDate.fromHighResTimestamp(highResTimestamp));
                this.animationFrame = requestAnimationFrame(redrawMe);
            };
            this.animationFrame = requestAnimationFrame(redrawMe);
        } else {
            this.interval = setInterval(() => this.setTimestamp(Date.now()), 1000 / this.options.framerate);
        }
    }

    onUnmount() {
        this.interval && clearInterval(this.interval);
        this.animationFrame && cancelAnimationFrame(this.animationFrame);
    }
}

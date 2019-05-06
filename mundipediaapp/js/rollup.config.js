import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import includePaths from "rollup-plugin-includepaths";

var fs = require("fs");
var path = require('path');

var rootDir = __dirname;

while (!fs.existsSync(rootDir + "/stem.json")) {
    rootDir = path.dirname(rootDir);
    if (rootDir === path.dirname(rootDir)) {
        exit("Can't find stem.json in the path tree.");
    }
}

rootDir = path.normalize(rootDir + "/");

let establishmentModules = ["accounts", "blog", "chat", "content", "funnel", "documentation", "errors", "forum", "localization",
                            "webapp", "socialaccount"];
let modules = ["analytics", "mundipediaapp"];
for (let module of establishmentModules) {
    modules.push("establishment/" + module);
}

let modulesDirectories = [
    path.join(rootDir, "stemjs/src/"),
    path.join(rootDir, "stemjs/src/base"),
    path.join(rootDir, "stemjs/src/data-structures"),
    path.join(rootDir, "stemjs/src/markup"),
    path.join(rootDir, "stemjs/src/state"),
    path.join(rootDir, "stemjs/src/ui"),
    path.join(rootDir, "stemjs/src/time"),
    path.join(rootDir, "node_modules"),
    path.join(rootDir, "node_modules/d3-array/src"),
    path.join(rootDir, "node_modules/d3-geo/src"),
    path.join(rootDir, "node_modules/d3-geo-projection/src"),
];

for (let module of modules) {
    modulesDirectories.push(path.join(rootDir, module, "/js"));
    modulesDirectories.push(path.join(rootDir, module, "/js/state"));
    modulesDirectories.push(path.join(rootDir, module, "/static/js"));
    modulesDirectories.push(path.join(rootDir, module, "/static/js/state"));
}

modulesDirectories.push(path.join(rootDir, "establishment/content/static/js/markup"));

let includePathOptions = {
    paths: modulesDirectories,
    // external: ["d3"],
    extensions: [".jsx", ".js"],
};

const argv = require("yargs").argv;

const isProductionBuild = argv.production;
const generateSourceMap = argv.sourceMap || isProductionBuild || true; // TODO

const babelOptions = {
    babelrc: false,
    plugins: [
        [
            "@babel/plugin-transform-react-jsx",
            {
                pragma: "UI.createElement"
            }
        ],
        [
            "@babel/plugin-proposal-decorators",
            {
                legacy: true
            }
        ],
        ["@babel/plugin-proposal-class-properties", { loose : true }],
    ],
    runtimeHelpers: true,
    presets: [
        [
            "@babel/env",
            {
                modules: false,
                // useBuiltIns: "usage",
                targets: "> 0.25%, not dead",
                // debug: true,
                loose: true, // Make code more compact, is not 100% compatible with ES6 specs
            }
        ]
    ]
};

export default {
    input: "Bundle.js",
    plugins: [
        includePaths(includePathOptions),
        babel(babelOptions),
        uglify(),
    ],
    output: {
        file: "../static/js/bundle.js",
        format: "iife",
        name: "Bundle",
        sourcemap: generateSourceMap,
    },
};

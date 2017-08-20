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

let establishmentModules = ["accounts", "blog", "chat", "content", "funnel", "documentation", "errors", "forum", "localization"];
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
    external: ["d3"],
    extensions: [".es6.js", ".jsx", ".js"],
};

const argv = require("yargs").argv;

const isProductionBuild = argv.production;
const generateSourceMap = argv.sourceMap || isProductionBuild || true; // TODO

export default {
    entry: "Bundle.js",
    format: "iife",
    moduleName: "Bundle",
    plugins: [
        includePaths(includePathOptions),
        babel(),
        // uglify(),
    ],
    dest: "../static/js/bundle.js",
    sourceMap: generateSourceMap,
};

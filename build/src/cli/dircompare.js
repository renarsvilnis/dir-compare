#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var fs_1 = __importDefault(require("fs"));
var util_1 = __importDefault(require("util"));
var dircompare = __importStar(require("../index"));
var print_1 = __importDefault(require("../print"));
var utils_1 = require("../utils");
var package_json_1 = __importDefault(require("./../../package.json"));
commander_1.default
    .version(package_json_1.default.version)
    .usage("[options] leftdir rightdir")
    .option("-c, --compare-content", "compare files by content")
    .option("-D, --compare-date", "compare files by date")
    .option("--date-tolerance [type]", "tolerance to be used in date comparison (milliseconds)")
    .option("-f, --filter [type]", "file name filter", undefined)
    .option("-x, --exclude [type]", "file/directory name exclude filter", undefined)
    .option("-S, --skip-subdirs", "do not recurse into subdirectories")
    .option("-L, --skip-symlinks", "ignore symlinks")
    .option("-i, --ignore-case", "ignores case when comparing file names")
    .option("-l, --show-left", "report - show entries occurring in leftdir")
    .option("-r, --show-right", "report - show entries occurring in rightdir")
    .option("-e, --show-equal", "report - show identic entries occuring in both dirs")
    .option("-d, --show-distinct", "report - show distinct entries occuring in both dirs")
    .option("-a, --show-all", "report - show all entries")
    .option("-w, --whole-report", "report - include directories in detailed report")
    .option("--csv", "report - print details as csv")
    .option("--nocolors", "don't use console colors");
commander_1.default.on("--help", function () {
    console.log("  By default files are compared by size.");
    console.log("  --date-tolerance defaults to 1000 ms. Two files are considered to have");
    console.log("  the same date if the difference between their modification dates fits");
    console.log("  within date tolerance.");
    console.log("");
    console.log("  Exit codes:");
    console.log("    0 - entries are identical");
    console.log("    1 - entries are different");
    console.log("    2 - error occurred");
    console.log("");
    console.log("  Examples:");
    console.log("  compare by content         dircompare -c dir1 dir2");
    console.log("  exclude filter             dircompare -x .git dir1 dir2");
    console.log("  include filter             dircompare -f *.js,*.yml dir1 dir2");
    console.log("  show only different files  dircompare -d dir1 dir2");
});
// Fix for https://github.com/tj/commander.js/issues/125
commander_1.default.allowUnknownOption();
commander_1.default.parse(process.argv);
var parsed = commander_1.default.parseOptions(commander_1.default.normalize(process.argv.slice(2)));
if (parsed.unknown.length > 0) {
    console.error("Unknown options: " + parsed.unknown);
    process.exit(2);
}
function run() {
    try {
        if (commander_1.default.args.length !== 2) {
            commander_1.default.outputHelp();
            process.exit(2);
            return;
        }
        var options = {
            compareContent: commander_1.default.compareContent,
            compareDate: commander_1.default.compareDate,
            compareSize: true,
            skipSubdirs: commander_1.default.skipSubdirs,
            skipSymlinks: commander_1.default.skipSymlinks,
            ignoreCase: commander_1.default.ignoreCase,
            includeFilter: commander_1.default.filter,
            excludeFilter: commander_1.default.exclude,
            noDiffSet: !(commander_1.default.showAll ||
                commander_1.default.showEqual ||
                commander_1.default.showLeft ||
                commander_1.default.showRight ||
                commander_1.default.showDistinct),
            dateTolerance: commander_1.default.dateTolerance || 1000
        };
        var path1 = commander_1.default.args[0];
        var path2 = commander_1.default.args[1];
        // TODO: maybe add joe with typescript?
        if (!utils_1.isNumericLike(options.dateTolerance)) {
            console.error("Numeric value expected for --date-tolerance");
            process.exit(2);
            return;
        }
        if (!fs_1.default.existsSync(path1)) {
            console.error(util_1.default.format("Path '%s' missing"), path1);
            process.exit(2);
            return;
        }
        if (!fs_1.default.existsSync(path2)) {
            console.error(util_1.default.format("path '%s' missing"), path2);
            process.exit(2);
            return;
        }
        dircompare.compareAsync(path1, path2, options).then(function (res) {
            // PRINT DETAILS
            print_1.default(res, process.stdout, commander_1.default);
            if (res.same) {
                process.exit(0);
            }
            else {
                process.exit(1);
            }
        }, function (error) {
            console.error("Error occurred: " + (error instanceof Error ? error.stack : error));
            process.exit(2);
        });
    }
    catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
}
run();
//# sourceMappingURL=dircompare.js.map
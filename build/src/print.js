"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var colors_1 = __importDefault(require("colors"));
var util_1 = __importDefault(require("util"));
var path_1 = __importDefault(require("path"));
// TODO: migrate to path.join()?
var PATH_SEP = path_1.default.sep;
var nocolor = function (str) { return str; };
function print(res, writer, program) {
    var cequal = program.nocolors ? nocolor : colors_1.default.green;
    var cdistinct = program.nocolors ? nocolor : colors_1.default.red;
    var cleft = nocolor;
    var cright = nocolor;
    var cdir = nocolor;
    var cmissing = program.nocolors ? nocolor : colors_1.default.yellow;
    // TODO: maybe remove  relativePathMaxLength and fileNameMaxLength if not used
    // in printPretty() function
    // calculate relative path length for pretty print
    var relativePathMaxLength = 0;
    var fileNameMaxLength = 0;
    if (!program.csv && res.diffSet) {
        res.diffSet.forEach(function (detail) {
            if (detail.relativePath.length > relativePathMaxLength) {
                relativePathMaxLength = detail.relativePath.length;
            }
            var len = getCompareFile(detail, "??", cmissing).length;
            if (len > fileNameMaxLength) {
                fileNameMaxLength = len;
            }
        });
    }
    // csv header
    if (program.csv) {
        writer.write("path,name,state,type,size1,size2,date1,date2\n");
    }
    if (res.diffSet) {
        for (var i = 0; i < res.diffSet.length; i++) {
            var detail = res.diffSet[i];
            var color, show = true;
            if (!program.wholeReport) {
                // show only files
                var type = detail.type1 !== "missing" ? detail.type1 : detail.type2;
                if (type !== "file") {
                    show = false;
                }
            }
            if (show) {
                switch (detail.state) {
                    case "equal":
                        color = cequal;
                        show = program.showAll || program.showEqual ? true : false;
                        break;
                    case "left":
                        color = cleft;
                        show = program.showAll || program.showLeft ? true : false;
                        break;
                    case "right":
                        color = cright;
                        show = program.showAll || program.showRight ? true : false;
                        break;
                    case "distinct":
                        color = cdistinct;
                        show = program.showAll || program.showDistinct ? true : false;
                        break;
                    default:
                        show = true;
                        color = colors_1.default.gray;
                }
                if (show) {
                    if (program.csv) {
                        printCsv(writer, detail, color);
                    }
                    else {
                        printPretty(writer, program, detail, color, cdir, cmissing, relativePathMaxLength, fileNameMaxLength);
                    }
                }
            }
        }
    }
    // PRINT STATISTICS
    var statTotal, statEqual, statLeft, statRight, statDistinct;
    if (program.wholeReport) {
        statTotal = res.total;
        statEqual = res.equal;
        statLeft = res.left;
        statRight = res.right;
        statDistinct = res.distinct;
    }
    else {
        statTotal = res.totalFiles;
        statEqual = res.equalFiles;
        statLeft = res.leftFiles;
        statRight = res.rightFiles;
        statDistinct = res.distinctFiles;
    }
    if (!program.noDiffIndicator) {
        writer.write(res.same ? cequal("Entries are identical\n") : cdistinct("Entries are different\n"));
    }
    writer.write(util_1.default.format("total: %s, equal: %s, distinct: %s, only left: %s, only right: %s\n", statTotal, cequal(statEqual.toString()), cdistinct(statDistinct.toString()), cleft(statLeft.toString()), cright(statRight.toString())));
}
exports.default = print;
// NOTE: Unused funtion from rewrite to typescript
// function tab(tabs: number) {
//   var res = "";
//   while (tabs >= 0) {
//     res += " ";
//     tabs--;
//   }
//   return res;
// }
/**
 * Print details for default view mode
 */
function printPretty(writer, program, detail, color, dircolor, missingcolor, relativePathMaxLength, fileNameMaxLength) {
    var path = detail.relativePath === "" ? PATH_SEP : detail.relativePath;
    var state;
    switch (detail.state) {
        case "equal":
            state = "==";
            break;
        case "left":
            state = "->";
            break;
        case "right":
            state = "<-";
            break;
        case "distinct":
            state = "<>";
            break;
        default:
            state = "?";
    }
    //   const spacePad = relativePathMaxLength - path.length;
    var type = "";
    type = detail.type1 !== "missing" ? detail.type1 : detail.type2;
    if (type === "directory") {
        type = dircolor(type);
    }
    //   const cmpentrylen = getCompareFile(detail, "??", missingcolor).length;
    var cmpentry = getCompareFile(detail, color(state), missingcolor);
    if (program.wholeReport) {
        writer.write(util_1.default.format("[%s] %s(%s)\n", path, cmpentry, type));
    }
    else {
        writer.write(util_1.default.format("[%s] %s\n", path, cmpentry));
    }
}
function getCompareFile(detail, state, missingcolor) {
    var p1 = detail.name1 ? detail.name1 : "";
    var p2 = detail.name2 ? detail.name2 : "";
    var missing1 = detail.type1 === "missing" ? missingcolor("missing") : "";
    var missing2 = detail.type2 === "missing" ? missingcolor("missing") : "";
    return util_1.default.format("%s%s%s%s%s", missing1, p1, state, missing2, p2);
}
/**
 * Print csv details.
 */
function printCsv(writer, detail, color) {
    var size1 = detail.type1 === "file" && detail.size1 != undefined ? detail.size1 : "";
    var size2 = detail.type2 === "file" && detail.size2 != undefined ? detail.size2 : "";
    var date1 = detail.date1 != undefined ? detail.date1.toISOString() : "";
    var date2 = detail.date2 != undefined ? detail.date2.toISOString() : "";
    var type = detail.type1 !== "missing" ? detail.type1 : detail.type2;
    var path = detail.relativePath ? detail.relativePath : PATH_SEP;
    var name = detail.name1 ? detail.name1 : detail.name2;
    writer.write(util_1.default.format("%s,%s,%s,%s,%s,%s,%s,%s\n", path, name, color(detail.state), type, size1, size2, date1, date2));
}
//# sourceMappingURL=print.js.map
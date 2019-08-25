import colors from "colors";
import util from "util";
import pathUtils from "path";
import { Writable } from "stream";
import { CommanderStatic } from "commander";
import { Statistics } from "./types";

// TODO: migrate to path.join()?
const PATH_SEP = pathUtils.sep;

// Prints dir compare results.
// 'program' represents display options and correspond to dircompare command line parameters.
// Example: 'dircompare --show-all --exclude *.js dir1 dir2' translates into
// program: {showAll: true, exclude: '*.js'}

type ColorFn = (str: string) => string;

const nocolor: ColorFn = (str: string) => str;

export default function print(res: Statistics, writer: Writable, program: CommanderStatic) {
  const cequal = program.nocolors ? nocolor : colors.green;
  const cdistinct = program.nocolors ? nocolor : colors.red;
  const cleft = nocolor;
  const cright = nocolor;
  const cdir = nocolor;
  const cmissing = program.nocolors ? nocolor : colors.yellow;

  // TODO: maybe remove  relativePathMaxLength and fileNameMaxLength if not used
  // in printPretty() function
  // calculate relative path length for pretty print
  let relativePathMaxLength = 0;
  let fileNameMaxLength = 0;

  if (!program.csv && res.diffSet) {
    res.diffSet.forEach(function(detail) {
      if (detail.relativePath.length > relativePathMaxLength) {
        relativePathMaxLength = detail.relativePath.length;
      }
      const len = getCompareFile(detail, "??", cmissing).length;
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
    for (let i = 0; i < res.diffSet.length; i++) {
      var detail = res.diffSet[i];
      var color,
        show = true;

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
            color = colors.gray;
        }
        if (show) {
          if (program.csv) {
            printCsv(writer, detail, color);
          } else {
            printPretty(writer, program, detail, color, cdir, cmissing, relativePathMaxLength, fileNameMaxLength);
          }
        }
      }
    }
  }

  // PRINT STATISTICS
  let statTotal, statEqual, statLeft, statRight, statDistinct;
  if (program.wholeReport) {
    statTotal = res.total;
    statEqual = res.equal;
    statLeft = res.left;
    statRight = res.right;
    statDistinct = res.distinct;
  } else {
    statTotal = res.totalFiles;
    statEqual = res.equalFiles;
    statLeft = res.leftFiles;
    statRight = res.rightFiles;
    statDistinct = res.distinctFiles;
  }
  if (!program.noDiffIndicator) {
    writer.write(res.same ? cequal("Entries are identical\n") : cdistinct("Entries are different\n"));
  }
  writer.write(
    util.format(
      "total: %s, equal: %s, distinct: %s, only left: %s, only right: %s\n",
      statTotal,
      cequal(statEqual.toString()),
      cdistinct(statDistinct.toString()),
      cleft(statLeft.toString()),
      cright(statRight.toString())
    )
  );
}

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
function printPretty(
  writer: Writable,
  program: CommanderStatic,
  detail,
  color: ColorFn,
  dircolor: ColorFn,
  missingcolor: ColorFn,
  relativePathMaxLength: number,
  fileNameMaxLength?: number
) {
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
  let type = "";
  type = detail.type1 !== "missing" ? detail.type1 : detail.type2;
  if (type === "directory") {
    type = dircolor(type);
  }
  //   const cmpentrylen = getCompareFile(detail, "??", missingcolor).length;
  const cmpentry = getCompareFile(detail, color(state), missingcolor);
  if (program.wholeReport) {
    writer.write(util.format("[%s] %s(%s)\n", path, cmpentry, type));
  } else {
    writer.write(util.format("[%s] %s\n", path, cmpentry));
  }
}

function getCompareFile(detail, state, missingcolor: ColorFn) {
  const p1 = detail.name1 ? detail.name1 : "";
  const p2 = detail.name2 ? detail.name2 : "";

  const missing1 = detail.type1 === "missing" ? missingcolor("missing") : "";
  const missing2 = detail.type2 === "missing" ? missingcolor("missing") : "";

  return util.format("%s%s%s%s%s", missing1, p1, state, missing2, p2);
}

/**
 * Print csv details.
 */
function printCsv(writer: Writable, detail, color: ColorFn) {
  const size1 = detail.type1 === "file" && detail.size1 != undefined ? detail.size1 : "";
  const size2 = detail.type2 === "file" && detail.size2 != undefined ? detail.size2 : "";

  const date1 = detail.date1 != undefined ? detail.date1.toISOString() : "";
  const date2 = detail.date2 != undefined ? detail.date2.toISOString() : "";

  const type = detail.type1 !== "missing" ? detail.type1 : detail.type2;

  const path = detail.relativePath ? detail.relativePath : PATH_SEP;
  const name = detail.name1 ? detail.name1 : detail.name2;

  writer.write(
    util.format("%s,%s,%s,%s,%s,%s,%s,%s\n", path, name, color(detail.state), type, size1, size2, date1, date2)
  );
}

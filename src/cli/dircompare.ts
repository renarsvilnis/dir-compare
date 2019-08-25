#!/usr/bin/env node

import program from "commander";
import fs from "fs";
import util from "util";

import * as dircompare from "../index";
import print from "../print";
import { isNumericLike } from "../utils";
import pjson from "./../../package.json";
import { Options, Statistics } from "../types";

program
  .version(pjson.version)
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
  .option("--nocolors", "don't use console colors")
  .option("--async", "Make use of multiple cores");

program.on("--help", function() {
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
program.allowUnknownOption();
program.parse(process.argv);
var parsed = program.parseOptions(program.normalize(process.argv.slice(2)));
if (parsed.unknown.length > 0) {
  console.error("Unknown options: " + parsed.unknown);
  process.exit(2);
}

function run() {
  try {
    if (program.args.length !== 2) {
      program.outputHelp();
      process.exit(2);
      return;
    }

    const options: Options = {
      compareContent: program.compareContent,
      compareDate: program.compareDate,
      compareSize: true,
      skipSubdirs: program.skipSubdirs,
      skipSymlinks: program.skipSymlinks,
      ignoreCase: program.ignoreCase,
      includeFilter: program.filter,
      excludeFilter: program.exclude,
      noDiffSet: !(
        program.showAll ||
        program.showEqual ||
        program.showLeft ||
        program.showRight ||
        program.showDistinct
      ),
      dateTolerance: program.dateTolerance || 1000
    };

    const async = program.async;
    const path1 = program.args[0];
    const path2 = program.args[1];

    // TODO: maybe add joe with typescript?
    if (!isNumericLike(options.dateTolerance)) {
      console.error("Numeric value expected for --date-tolerance");
      process.exit(2);
      return;
    }

    if (!fs.existsSync(path1)) {
      console.error(util.format("Path '%s' missing"), path1);
      process.exit(2);
      return;
    }

    if (!fs.existsSync(path2)) {
      console.error(util.format("path '%s' missing"), path2);
      process.exit(2);
      return;
    }

    // compare
    const compareFn = async
      ? dircompare.compareAsync
      : () =>
          new Promise<Statistics>(resolve => {
            resolve(dircompare.compareSync(path1, path2, options));
          });

    compareFn(path1, path2, options).then(
      res => {
        // PRINT DETAILS
        print(res, process.stdout, program);
        if (res.same) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      },
      error => {
        console.error("Error occurred: " + (error instanceof Error ? error.stack : error));
        process.exit(2);
      }
    );
  } catch (e) {
    console.error(e.stack);
    process.exit(2);
  }
}

run();

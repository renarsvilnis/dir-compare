import * as pathUtils from "path";
import * as fs from "fs";
import { promisify } from "util";

import compareAsyncInternal from "./compareAsync";
import defaultResultBuilderCallback from "./defaultResultBuilderCallback";
import * as defaultFileCompare from "./file_compare_handlers/defaultFileCompare";
import * as lineBasedFileCompare from "./file_compare_handlers/lineBasedFileCompare";
import { entryFactory, symlinkCacheFactory, statisticsFactory, isNumericLike } from "./utils";

const realpathAsync = promisify(fs.realpath);

import { Options, Statistics, DiffSet, AsyncDiffSet } from "./types";

const DefaultOptions = {
  compareSize: false,
  compareDate: false,
  dateTolerance: 1000,
  compareContent: false,
  skipSubdirs: false,
  skipSymlinks: false,
  ignoreCase: false,
  // includeFilter:
  // excludeFilter
  compareFile: defaultFileCompare,
  resultBuilder: defaultResultBuilderCallback
};

export async function compareAsync(path1: string, path2: string, options: Options): Promise<Statistics> {
  const [realPath1, realPath2] = await Promise.all([realpathAsync(path1), realpathAsync(path2)]);

  // realpath() is necessary for loop detection to work properly
  const absolutePath1 = pathUtils.normalize(pathUtils.resolve(realPath1));
  const absolutePath2 = pathUtils.normalize(pathUtils.resolve(realPath2));

  const statistics = statisticsFactory();
  options = prepareOptions(options);

  // Resursive diffset
  const asyncDiffSet: AsyncDiffSet = [];

  const symlinkCache = symlinkCacheFactory();
  const initialLevel = 0;
  const initialRelativePath = "";

  await compareAsyncInternal(
    entryFactory(absolutePath1, path1, pathUtils.basename(path1)),
    entryFactory(absolutePath2, path2, pathUtils.basename(path2)),
    initialLevel,
    initialRelativePath,
    options,
    statistics,
    asyncDiffSet,
    symlinkCache
  );

  normalizeStatistics(statistics);

  statistics.diffSet = flattenAsyncDiffSet(asyncDiffSet!);

  return statistics;
}

function prepareOptions(options: Options): Options {
  options = options || {};

  // TODO: should it just use the util.clone? See that it doesnt copy methods!
  var clone = JSON.parse(JSON.stringify(options));
  clone.compareFile = options.compareFile || defaultFileCompare;
  clone.resultBuilder = options.resultBuilder || defaultResultBuilderCallback;
  clone.dateTolerance = clone.dateTolerance ? Number(clone.dateTolerance) : 1000;

  if (isNumericLike(clone.dateTolerance)) {
    throw new Error("Date tolerance is not a number");
  }
  return clone;
}

function normalizeStatistics(statistics: Statistics) {
  statistics.differences = statistics.distinct + statistics.left + statistics.right;
  statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles;
  statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs;
  statistics.total = statistics.equal + statistics.differences;
  statistics.totalFiles = statistics.equalFiles + statistics.differencesFiles;
  statistics.totalDirs = statistics.equalDirs + statistics.differencesDirs;
  statistics.same = statistics.differences ? false : true;
}

/**
 * Async diffsets are kept into recursive structures.
 * This method transforms them into one dimensional arrays.
 */
function flattenAsyncDiffSet(asyncDiffSet: AsyncDiffSet): DiffSet {
  return [asyncDiffSet].flat(Infinity);
  //   asyncDiffSet.forEach(rawDiff => {
  //     if (!Array.isArray(rawDiff)) {
  //       diffSet.push(rawDiff);
  //     } else {
  //       flattenAsyncDiffSet(statistics, rawDiff, diffSet);
  //     }
  //   });
}

export const fileCompareHandlers = {
  defaultFileCompare: defaultFileCompare,
  lineBasedFileCompare: lineBasedFileCompare
};

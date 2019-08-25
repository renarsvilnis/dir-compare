import fs from "fs";
import pathUtils from "path";
import {promisify} from "bluebird";

import {
  detectLoop,
  compareEntryIgnoreCase,
  compareEntryCaseSensitive,
  getType,
  sameDate,
  cloneSymlinkCache,
  filterEntry,
  fastPathJoin
} from "./utils";
import { Entry, SymlinkCache, Options, Statistics, DifferenceType, AsyncDiffSet, DiffSet } from "./types";

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const lstatAsync = promisify(fs.lstat);

/**
 * Compares two directories asynchronously.
 */
export default async function compareAsync(
  rootEntry1: Entry | undefined,
  rootEntry2: Entry | undefined,
  level: number,
  relativePath: string,
  options: Options,
  statistics: Statistics,
  diffSet: AsyncDiffSet,
  symlinkCache: SymlinkCache
): Promise<Statistics> {
  const loopDetected1 = detectLoop(rootEntry1, symlinkCache.dir1);
  const loopDetected2 = detectLoop(rootEntry2, symlinkCache.dir2);

  if (rootEntry1 && !loopDetected1) {
    const symlinkCachePath1 = rootEntry1.symlink ? fs.realpathSync(rootEntry1.absolutePath) : rootEntry1.absolutePath;
    symlinkCache.dir1[symlinkCachePath1] = true;
  }
  if (rootEntry2 && !loopDetected2) {
    const symlinkCachePath2 = rootEntry2.symlink ? fs.realpathSync(rootEntry2.absolutePath) : rootEntry2.absolutePath;
    symlinkCache.dir2[symlinkCachePath2] = true;
  }
  const absolutePath1 = rootEntry1 ? rootEntry1.absolutePath : undefined;
  const absolutePath2 = rootEntry2 ? rootEntry2.absolutePath : undefined;
  const path1 = rootEntry1 ? rootEntry1.path : undefined;
  const path2 = rootEntry2 ? rootEntry2.path : undefined;

  const entriesResult = await Promise.all([
    getEntries(absolutePath1, path1, options, loopDetected1),
    getEntries(absolutePath2, path2, options, loopDetected2)
  ]);

  const entries1 = entriesResult[0];
  const entries2 = entriesResult[1];
  let i1 = 0;
  let i2 = 0;
  const comparePromises = [];
  const compareFilePromises = [];

  while (i1 < entries1.length || i2 < entries2.length) {
    const entry1 = entries1[i1];
    const entry2 = entries2[i2];
    //   const n1 = entry1 ? entry1.name : undefined;
    //   const n2 = entry2 ? entry2.name : undefined;
    const p1 = entry1 ? entry1.absolutePath : undefined;
    const p2 = entry2 ? entry2.absolutePath : undefined;
    const fileStat1 = entry1 ? entry1.stat : undefined;
    const fileStat2 = entry2 ? entry2.stat : undefined;
    let type1, type2;

    // compare entry name (-1, 0, 1)
    let cmp;
    if (i1 < entries1.length && i2 < entries2.length) {
      cmp = options.ignoreCase ? compareEntryIgnoreCase(entry1, entry2) : compareEntryCaseSensitive(entry1, entry2);
      type1 = getType(fileStat1);
      type2 = getType(fileStat2);
    } else if (i1 < entries1.length) {
      type1 = getType(fileStat1);
      type2 = getType(undefined);
      cmp = -1;
    } else {
      type1 = getType(undefined);
      type2 = getType(fileStat2);
      cmp = 1;
    }

    // process entry
    if (cmp === 0) {
      // Both left/right exist and have the same name and type
      let samePromise = undefined;
let same = undefined;
      if (type1 === "file") {
        if (options.compareSize && fileStat1.size !== fileStat2.size) {
          same = false;
        } else if (options.compareDate && !sameDate(fileStat1.mtime, fileStat2.mtime, options.dateTolerance)) {
          same = false;
        } else if (options.compareContent) {
          var cmpFile = function(entry1, entry2, type1, type2) {
              const subDiffSet: AsyncDiffSet = [];
              diffSet.push(subDiffSet);
            samePromise = options
              .compareFile(p1, fileStat1, p2, fileStat2, options)
              .then((comparisonResult) => {
                var same, error;
                if (typeof comparisonResult === "boolean") {
                  same = comparisonResult;
                } else {
                  error = comparisonResult;
                }

                return {
                  entry1: entry1,
                  entry2: entry2,
                  same: same,
                  error: error,
                  type1: type1,
                  type2: type2,
                  diffSet: subDiffSet
                };
              });
          };
          cmpFile(entry1, entry2, type1, type2);
        } else {
          same = true;
        }
      } else {
        same = true;
      }
      if (same !== undefined) {
        doStats(entry1, entry2, same, statistics, options, level, relativePath, diffSet, type1, type2);
      } else {
        compareFilePromises.push(samePromise);
      }

      i1++;
      i2++;
      if (!options.skipSubdirs && type1 === "directory") {
          const subDiffSet:AsyncDiffSet = [];
          diffSet.push(subDiffSet);

        comparePromises.push(
          compareAsync(
            entry1,
            entry2,
            level + 1,
            fastPathJoin(relativePath, entry1.name),
            options,
            statistics,
            subDiffSet,
            cloneSymlinkCache(symlinkCache)
          )
        );
      }
    } else if (cmp < 0) {
      // Right missing
        options.resultBuilder(entry1, undefined, "left", level, relativePath, options, statistics, diffSet);
      statistics.left++;
      if (type1 === "file") {
        statistics.leftFiles++;
      } else {
        statistics.leftDirs++;
      }
      i1++;
      if (type1 === "directory" && !options.skipSubdirs) {
          const subDiffSet:AsyncDiffSet = [];
          diffSet.push(subDiffSet);

        comparePromises.push(
          compareAsync(
            entry1,
            undefined,
            level + 1,
            fastPathJoin(relativePath, entry1.name),
            options,
            statistics,
            subDiffSet,
            cloneSymlinkCache(symlinkCache)
          )
        );
      }
    } else {
      // Left missing
        const  subDiffSet: AsyncDiffSet = [];
        diffSet.push(subDiffSet);
        options.resultBuilder(undefined, entry2, "right", level, relativePath, options, statistics, subDiffSet);
        
      statistics.right++;
      if (type2 === "file") {
        statistics.rightFiles++;
      } else {
        statistics.rightDirs++;
      }
      i2++;
      if (type2 === "directory" && !options.skipSubdirs) {
        // TODO: make it "dry" by moving it into a function
        const subDiffSet: AsyncDiffSet = [];
          diffSet.push(subDiffSet);
        }
        comparePromises.push(
          compareAsync(
            undefined,
            entry2,
            level + 1,
            fastPathJoin(relativePath, entry2.name),
            options,
            statistics,
            subDiffSet,
            cloneSymlinkCache(symlinkCache)
          )
        );
      }
    }

    await Promise.all(comparePromises);
    const sameResults = await Promise.all(compareFilePromises);

    for (var i = 0; i < sameResults.length; i++) {
      var sameResult = sameResults[i];
      if (sameResult.error) {
        throw new Error(sameResult.error);
      }
      
      doStats(
        sameResult.entry1,
        sameResult.entry2,
        sameResult.same,
        statistics,
        options,
        level,
        relativePath,
        sameResult.diffSet,
        sameResult.type1,
        sameResult.type2
      );
    }
  });
}

/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(absolutePath: path, path: path, options, loopDetected: boolean): Promise<Entry[]> {
  if (!absolutePath || loopDetected) {
    return Promise.resolve([]);
  } else {
    return statAsync(absolutePath).then(function(statPath) {
      if (statPath.isDirectory()) {
        return readdirAsync(absolutePath).then(function(rawEntries) {
          return buildEntries(absolutePath, path, rawEntries, options);
        });
      } else {
        var name = pathUtils.basename(absolutePath);
        return [
          {
            name: name,
            absolutePath: absolutePath,
            path: path,
            stat: statPath
          }
        ];
      }
    });
  }
}

function buildEntries(absolutePath: string, path: string, rawEntries: Entry[], options: Options) {
  var promisedEntries = [];
  rawEntries.forEach(function(entryName) {
    promisedEntries.push(buildEntry(absolutePath, path, entryName, options));
  });
  return Promise.all(promisedEntries).then(function(entries) {
    var result = [];
    entries.forEach(function(entry) {
      if (filterEntry(entry, options)) {
        result.push(entry);
      }
    });
    return options.ignoreCase ? result.sort(compareEntryIgnoreCase) : result.sort(compareEntryCaseSensitive);
  });
}

async function buildEntry(absolutePath: string, path: string, entryName: string, options: Options) {
  var entryAbsolutePath = fastPathJoin(absolutePath, entryName);
  var entryPath = fastPathJoin(path, entryName);
  
  const lstatEntry = await lstatAsync(entryAbsolutePath)
  const isSymlink = lstatEntry.isSymbolicLink();
  const statPromise = options.skipSymlinks && isSymlink ? Promise.resolve(undefined) : statAsync(entryAbsolutePath);
  const statEntry = await statPromise;

  return {
    name: entryName,
    absolutePath: entryAbsolutePath,
    path: entryPath,
    stat: statEntry,
    lstat: lstatEntry,
    symlink: isSymlink
  };
}

function doStats(
  entry1: Entry,
  entry2: Entry,
  same: boolean,
  statistics: Statistics,
  options: Options,
  level: number,
  relativePath: string,
  diffSet: DiffSet,
  type1: DifferenceType,
  type2: DifferenceType
) {
    options.resultBuilder(
      entry1,
      entry2,
      same ? "equal" : "distinct",
      level,
      relativePath,
      options,
      statistics,
      diffSet
    );

  same ? statistics.equal++ : statistics.distinct++;
  if (type1 === "file") {
    same ? statistics.equalFiles++ : statistics.distinctFiles++;
  } else {
    same ? statistics.equalDirs++ : statistics.distinctDirs++;
  }
}

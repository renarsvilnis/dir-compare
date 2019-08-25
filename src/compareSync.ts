import fs from "fs";
import pathUtils from "path";

import { Options, Entry, SymlinkCache, DifferenceType } from "./types";
import * as common from "./utils";

// TODO: migrate to path.join()?
const PATH_SEP = pathUtils.sep;

type CompareResult = -1 | 0 | 1;

/**
 * Compares two directories synchronously.
 */
export default function compareSync(
  rootEntry1,
  rootEntry2,
  level,
  relativePath,
  options,
  statistics,
  diffSet,
  symlinkCache: SymlinkCache
) {
  const loopDetected1 = common.detectLoop(rootEntry1, symlinkCache.dir1);
  const loopDetected2 = common.detectLoop(rootEntry2, symlinkCache.dir2);

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
  const entries1 = loopDetected1 ? [] : getEntries(absolutePath1, path1, options);
  const entries2 = loopDetected2 ? [] : getEntries(absolutePath2, path2, options);
  let i1 = 0;
  let i2 = 0;
  while (i1 < entries1.length || i2 < entries2.length) {
    const entry1 = entries1[i1];
    const entry2 = entries2[i2];
    // const n1 = entry1 ? entry1.name : undefined;
    // const n2 = entry2 ? entry2.name : undefined;
    const p1 = entry1 ? entry1.absolutePath : undefined;
    const p2 = entry2 ? entry2.absolutePath : undefined;
    const fileStat1 = entry1 ? entry1.stat : undefined;
    const fileStat2 = entry2 ? entry2.stat : undefined;

    let type1: DifferenceType;
    let type2: DifferenceType;
    let cmp: CompareResult;

    if (i1 < entries1.length && i2 < entries2.length) {
      cmp = options.ignoreCase
        ? common.compareEntryIgnoreCase(entry1, entry2)
        : common.compareEntryCaseSensitive(entry1, entry2);
      type1 = common.getType(fileStat1);
      type2 = common.getType(fileStat2);
    } else if (i1 < entries1.length) {
      type1 = common.getType(fileStat1);
      type2 = common.getType(undefined);
      cmp = -1;
    } else {
      type1 = common.getType(undefined);
      type2 = common.getType(fileStat2);
      cmp = 1;
    }

    // process entry
    if (cmp === 0) {
      // Both left/right exist and have the same name and type
      var same;
      if (type1 === "file") {
        if (options.compareSize && fileStat1.size !== fileStat2.size) {
          same = false;
        } else if (options.compareDate && !common.sameDate(fileStat1.mtime, fileStat2.mtime, options.dateTolerance)) {
          same = false;
        } else if (options.compareContent) {
          same = options.compareFileSync(p1, fileStat1, p2, fileStat2, options);
        } else {
          same = true;
        }
      } else {
        same = true;
      }
      if (!options.noDiffSet) {
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
      }
      same ? statistics.equal++ : statistics.distinct++;
      if (type1 === "file") {
        same ? statistics.equalFiles++ : statistics.distinctFiles++;
      } else {
        same ? statistics.equalDirs++ : statistics.distinctDirs++;
      }
      i1++;
      i2++;
      if (!options.skipSubdirs && type1 === "directory") {
        compareSync(
          entry1,
          entry2,
          level + 1,
          relativePath + PATH_SEP + entry1.name,
          options,
          statistics,
          diffSet,
          common.cloneSymlinkCache(symlinkCache)
        );
      }
    } else if (cmp < 0) {
      // Right missing
      if (!options.noDiffSet) {
        options.resultBuilder(entry1, undefined, "left", level, relativePath, options, statistics, diffSet);
      }
      statistics.left++;
      if (type1 === "file") {
        statistics.leftFiles++;
      } else {
        statistics.leftDirs++;
      }
      i1++;
      if (type1 === "directory" && !options.skipSubdirs) {
        compareSync(
          entry1,
          undefined,
          level + 1,
          relativePath + PATH_SEP + entry1.name,
          options,
          statistics,
          diffSet,
          common.cloneSymlinkCache(symlinkCache)
        );
      }
    } else {
      // Left missing
      if (!options.noDiffSet) {
        options.resultBuilder(undefined, entry2, "right", level, relativePath, options, statistics, diffSet);
      }
      statistics.right++;
      if (type2 === "file") {
        statistics.rightFiles++;
      } else {
        statistics.rightDirs++;
      }
      i2++;
      if (type2 === "directory" && !options.skipSubdirs) {
        compareSync(
          undefined,
          entry2,
          level + 1,
          relativePath + PATH_SEP + entry2.name,
          options,
          statistics,
          diffSet,
          common.cloneSymlinkCache(symlinkCache)
        );
      }
    }
  }
}

/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(absolutePath: string | undefined, path: string, options: Options): Entry[] {
  if (!absolutePath) {
    return [];
  }

  var statPath = fs.statSync(absolutePath);
  if (statPath.isDirectory()) {
    var entries = fs.readdirSync(absolutePath);

    var res: Entry[] = [];
    entries.forEach(entryName => {
      var entryAbsolutePath = absolutePath + PATH_SEP + entryName;
      var entryPath = path + PATH_SEP + entryName;
      var lstatEntry = fs.lstatSync(entryAbsolutePath);
      var isSymlink = lstatEntry.isSymbolicLink();
      var statEntry;
      if (options.skipSymlinks && isSymlink) {
        statEntry = undefined;
      } else {
        statEntry = fs.statSync(entryAbsolutePath);
      }
      var entry = {
        name: entryName,
        absolutePath: entryAbsolutePath,
        path: entryPath,
        stat: statEntry,
        lstat: lstatEntry,
        symlink: isSymlink
      };
      if (common.filterEntry(entry, options)) {
        res.push(entry);
      }
    });
    return options.ignoreCase ? res.sort(common.compareEntryIgnoreCase) : res.sort(common.compareEntryCaseSensitive);
  }

  const name = pathUtils.basename(absolutePath);
  return [
    {
      name: name,
      absolutePath: absolutePath,
      path: path,
      stat: statPath
    }
  ];
}

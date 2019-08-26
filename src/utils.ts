import * as fs from "fs";
import minimatch from "minimatch";
import path from "path";

import { Entry, DifferenceType, SearchOptions, SymlinkCache, SymlinkCacheGroup, CompareResult } from "./types";

// Insted of shallow copy
// https://stackoverflow.com/a/10916838/1378261
// import v8 from "v8";
// const structuredClone = (obj: any) => {
//   return v8.deserialize(v8.serialize(obj));
// };

// TODO: libary previously used this over path.join, assuming for speed, but
// need to test it
export function fastPathJoin(root: string, entryName: string) {
  return root + path.sep + entryName;
}

export function detectLoop(entry: Entry | undefined, symlinkCacheGroup: SymlinkCacheGroup) {
  if (entry && entry.symlink) {
    const realPath = fs.realpathSync(entry.absolutePath);
    if (symlinkCacheGroup[realPath]) {
      return true;
    }
  }
  return false;
}

export function cloneSymlinkCache(symlinkCache: SymlinkCache) {
  return {
    dir1: shallowClone(symlinkCache.dir1),
    dir2: shallowClone(symlinkCache.dir2)
  };
}

// TODO: Maybe use different method of doing it, see if it requires copying
// methods aswell as propterties - https://thecodebarbarian.com/object-assign-vs-object-spread.html
function shallowClone<T>(obj: T): T {
  const cloned = {};
  Object.keys(obj).forEach(function(key) {
    cloned[key] = obj[key];
  });
  return cloned;
}

export function symlinkCacheFactory(): SymlinkCache {
  return {
    dir1: {},
    dir2: {}
  };
}

export function entryFactory(absolutePath: string, path: string, name: string): Entry {
  const statEntry = fs.statSync(absolutePath);
  const lstatEntry = fs.lstatSync(absolutePath);
  const isSymlink = lstatEntry.isSymbolicLink();
  return {
    name: name,
    absolutePath: absolutePath,
    path: path,
    stat: statEntry,
    lstat: lstatEntry,
    symlink: isSymlink
  };
}

/**
 * One of 'file','directory'
 */
export function getType(fileStat: fs.Stats) {
  if (fileStat.isDirectory()) {
    return "directory";
  } else {
    return "file";
  }
}
/**
 * Matches fileName with pattern.
 */
export function match(fileName: string, pattern: string): boolean {
  const patternArray = pattern.split(",");
  for (let i = 0; i < patternArray.length; i++) {
    const pat = patternArray[i];
    if (minimatch(fileName, pat, { dot: true })) {
      //nocase
      return true;
    }
  }
  return false;
}

/**
 * Filter entries by file name. Returns true if the file is to be processed.
 */
export function filterEntry(entry: Entry, options: SearchOptions): boolean {
  if (entry.symlink && options.skipSymlinks) {
    return false;
  }

  if (entry.stat.isFile() && options.includeFilter && !match(entry.name, options.includeFilter)) {
    return false;
  }

  if (options.excludeFilter && match(entry.name, options.excludeFilter)) {
    return false;
  }

  return true;
}
/**
 * Comparator for directory entries sorting.
 */
export function compareEntryCaseSensitive(a: Entry, b: Entry): CompareResult {
  if (a.stat.isDirectory() && b.stat.isFile()) {
    return -1;
  } else if (a.stat.isFile() && b.stat.isDirectory()) {
    return 1;
  } else {
    // http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
    const str1 = a.name,
      str2 = b.name;
    return str1 == str2 ? 0 : str1 > str2 ? 1 : -1;
  }
}
/**
 * Comparator for directory entries sorting.
 */
export function compareEntryIgnoreCase(a: Entry, b: Entry): CompareResult {
  if (a.stat.isDirectory() && b.stat.isFile()) {
    return -1;
  } else if (a.stat.isFile() && b.stat.isDirectory()) {
    return 1;
  } else {
    // http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
    const str1 = a.name.toLowerCase(),
      str2 = b.name.toLowerCase();
    return str1 == str2 ? 0 : str1 > str2 ? 1 : -1;
  }
}

/**
 * Compares two dates and returns true/false depending on tolerance (milliseconds).
 * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
 */
export function sameDate(date1: Date, date2: Date, tolerance: number): boolean {
  return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false;
}

/**
 * Tests if the input prepresents an numbering like input, e.g. "52.42"
 */
export function isNumericLike(n: any): boolean {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

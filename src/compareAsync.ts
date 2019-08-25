import fs from "fs";
import pathUtils from "path";
import {promisify} from "bluebird";
import path from 'path';

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
import { Entry, SymlinkCache, SearchOptions, Difference, DifferenceState } from "./types";

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const lstatAsync = promisify(fs.lstat);

interface CompareParams {
  rootEntry1?: Entry,
  rootEntry2?: Entry,
  level: number,
  relativePath:  string,
  searchOptions: SearchOptions,
  symlinkCache: SymlinkCache,
  onDifference: (difference: Difference) => void 
}

export default async function compareAsyncInternal({
  rootEntry1,
  rootEntry2,
  level,
  relativePath,
  searchOptions,
  symlinkCache,
  onDifference
}: CompareParams): Promise<void> {
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
    getEntries(absolutePath1, path1, searchOptions, loopDetected1),
    getEntries(absolutePath2, path2, searchOptions, loopDetected2)
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
      cmp = searchOptions.ignoreCase ? compareEntryIgnoreCase(entry1, entry2) : compareEntryCaseSensitive(entry1, entry2);
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
        if (searchOptions.compareSize && fileStat1.size !== fileStat2.size) {
          same = false;
        } else if (searchOptions.compareDate && !sameDate(fileStat1.mtime, fileStat2.mtime, searchOptions.dateTolerance)) {
          same = false;
        } else if (searchOptions.compareContent) {
          const cmpFile = (entry1, entry2, type1, type2) => {
              samePromise = searchOptions
              .compareFile(p1, fileStat1, p2, fileStat2, searchOptions)
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
        // TODO: rewrite somewhere else
        onDifference(createEntry(
          entry1,
          entry2,
          same ? "equal" : "distinct",
          level,
          relativePath
        ));
      } else {
        compareFilePromises.push(samePromise);
      }

      i1++;
      i2++;
      if (!searchOptions.skipSubdirs && type1 === "directory") {
        comparePromises.push(
          compareAsyncInternal({
            rootEntry1: entry1,
            rootEntry2: entry2,
            level: level + 1,
            relativePath: fastPathJoin(relativePath, entry1.name),
            searchOptions,
            onDifference,
            // TODO: why do i need clone it, maybe DeepReadonly<>?
            symlinkCache: cloneSymlinkCache(symlinkCache),
          )
        );
      }
    } else if (cmp < 0) {
      // Right missing
      onDifference(createEntry(entry1, undefined, "left", level, relativePath));

      i1++;
      if (type1 === "directory" && !searchOptions.skipSubdirs) {
        comparePromises.push(
          compareAsyncInternal({
            rootEntry1: entry1,
            rootEntry2: undefined,
            level: level + 1,
            relativePath: fastPathJoin(relativePath, entry1.name),
            searchOptions,
            onDifference,
            // TODO: same issue as above
            symlinkCache: cloneSymlinkCache(symlinkCache)
          })
        );
      }
    } else {
      // Left missing
      onDifference(createEntry(undefined, entry2, "right", level, relativePath));
        
      i2++;
      if (type2 === "directory" && !searchOptions.skipSubdirs) {
        comparePromises.push(
          compareAsyncInternal({
            rootEntry1: undefined,
            rootEntry2: entry2,
            level: level + 1,
            relativePath: fastPathJoin(relativePath, entry2.name),
            searchOptions,
            onDifference,
            // TODO: same symlink issue as before
            symlinkCache: cloneSymlinkCache(symlinkCache),
          })
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

      onDifference(createEntry(
        sameResult.entry1,
        sameResult.entry2,
        sameResult.same,
        level,
        relativePath
      ));
    }
  });
}

/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(absolutePath: string | undefined, path: string, options: SearchOptions, loopDetected: boolean): Promise<Entry[]> {
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

function buildEntries(absolutePath: string, path: string, rawEntries: Entry[], options: SearchOptions) {
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

async function buildEntry(absolutePath: string, path: string, entryName: string, options: SearchOptions) {
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

const createEntry = (entry1: Entry | undefined, entry2: Entry | undefined, state: DifferenceState, level: number, relativePath: string) => ({
  path1: entry1 ? path.dirname(entry1.path) : undefined,
  path2: entry2 ? path.dirname(entry2.path) : undefined,
  relativePath: relativePath,
  name1: entry1 ? entry1.name : undefined,
  name2: entry2 ? entry2.name : undefined,
  state: state,
  type1: getType(entry1 && entry1.stat),
  type2: getType(entry2 && entry2.stat),
  level: level,
  size1: entry1 ? entry1.stat.size : undefined,
  size2: entry2 ? entry2.stat.size : undefined,
  // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
  // date1: entry1 ? entry1.stat.mtime : undefined,
  // date1: entry1 ? entry1.stat.mtime : undefined,
  date1: entry2 ? entry2.stat.mtimeMs : undefined,
  date2: entry2 ? entry2.stat.mtimeMs : undefined
});

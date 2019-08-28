import fs from "fs";
import pathUtils from "path";
import { promisify } from "util";
import {
  createLeftOnlyDifference,
  createRightOnlyDifference,
  createEqualDifference,
  createDistinctDifference
} from "./utils/createDifference";

import {
  detectLoop,
  compareEntryIgnoreCase,
  compareEntryCaseSensitive,
  getTypeLoose,
  sameDate,
  cloneSymlinkCache,
  filterEntry,
  fastPathJoin
} from "./utils";
import { Entry, SymlinkCache, SearchOptions, Difference, CompareResult, DifferenceType } from "./types";

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const lstatAsync = promisify(fs.lstat);

interface CompareParams {
  rootEntry1?: Entry;
  rootEntry2?: Entry;
  level: number;
  relativePath: string;
  searchOptions: SearchOptions;
  symlinkCache: SymlinkCache;
  onDifference: (difference: Difference) => void;
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
  if (rootEntry1 && !loopDetected1) {
    const symlinkCachePath1 = rootEntry1.isSymlink ? fs.realpathSync(rootEntry1.absolutePath) : rootEntry1.absolutePath;
    symlinkCache.dir1[symlinkCachePath1] = true;
  }

  const loopDetected2 = detectLoop(rootEntry2, symlinkCache.dir2);
  if (rootEntry2 && !loopDetected2) {
    const symlinkCachePath2 = rootEntry2.isSymlink ? fs.realpathSync(rootEntry2.absolutePath) : rootEntry2.absolutePath;
    symlinkCache.dir2[symlinkCachePath2] = true;
  }

  const absolutePath1 = rootEntry1 ? rootEntry1.absolutePath : undefined;
  const absolutePath2 = rootEntry2 ? rootEntry2.absolutePath : undefined;
  const path1 = rootEntry1 ? rootEntry1.path : undefined;
  const path2 = rootEntry2 ? rootEntry2.path : undefined;

  const [entries1, entries2] = await Promise.all([
    getEntries(absolutePath1, path1, searchOptions, loopDetected1),
    getEntries(absolutePath2, path2, searchOptions, loopDetected2)
  ]);

  const comparePromises = [];
  const compareFilePromises = [];

  // TODO: add documentation
  let i1 = 0;
  let i2 = 0;

  // Cache entries length property as their lenght is static
  const entries1LengthCached = entries1.length;
  const entries2LengthCached = entries2.length;

  while (i1 < entries1LengthCached || i2 < entries2LengthCached) {
    const entry1 = entries1[i1];
    const entry2 = entries2[i2];
    const path1 = entry1 ? entry1.absolutePath : undefined;
    const path2 = entry2 ? entry2.absolutePath : undefined;
    const fileStat1 = entry1 ? entry1.stat : undefined;
    const fileStat2 = entry2 ? entry2.stat : undefined;
    let type1: DifferenceType;
    let type2: DifferenceType;

    let cmp: CompareResult;
    if (i1 < entries1LengthCached && i2 < entries2LengthCached) {
      type1 = getTypeLoose(fileStat1);
      type2 = getTypeLoose(fileStat2);
      cmp = searchOptions.ignoreCase
        ? compareEntryIgnoreCase(entry1, entry2)
        : compareEntryCaseSensitive(entry1, entry2);
    } else if (i1 < entries1LengthCached) {
      type1 = getTypeLoose(fileStat1);
      type2 = "missing";
      cmp = -1;
    } else {
      type1 = "missing";
      type2 = getTypeLoose(fileStat2);
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
        } else if (
          searchOptions.compareDate &&
          !sameDate(fileStat1.mtime, fileStat2.mtime, searchOptions.dateTolerance)
        ) {
          same = false;
        } else if (searchOptions.compareContent) {
          const cmpFile = (entry1: Entry, entry2: Entry, type1: DifferenceType, type2: DifferenceType) => {
            // TODO: improve error detection for compareFile result
            samePromise = searchOptions
              .compareFile(path1, fileStat1, path2, fileStat2, searchOptions)
              .then(comparisonResult => {
                const same, error;
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
                  type2: type2
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
        onDifference(
          same
            ? createEqualDifference(entry1, entry2, level, relativePath)
            : createDistinctDifference(entry1, entry2, level, relativePath)
        );
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
            symlinkCache: cloneSymlinkCache(symlinkCache)
          })
        );
      }
    } else if (cmp < 0) {
      // Right missing
      onDifference(createLeftOnlyDifference(entry1, level, relativePath));

      i1++;
      if (!searchOptions.skipSubdirs && type1 === "directory") {
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
      onDifference(createRightOnlyDifference(entry2, level, relativePath));

      i2++;
      if (!searchOptions.skipSubdirs && type2 === "directory") {
        comparePromises.push(
          compareAsyncInternal({
            rootEntry1: undefined,
            rootEntry2: entry2,
            level: level + 1,
            relativePath: fastPathJoin(relativePath, entry2.name),
            searchOptions,
            onDifference,
            // TODO: same symlink issue as before
            symlinkCache: cloneSymlinkCache(symlinkCache)
          })
        );
      }
    }

    await Promise.all(comparePromises);
    const sameResults = await Promise.all(compareFilePromises);

    for (let i = 0; i < sameResults.length; i++) {
      const sameResult = sameResults[i];
      if (sameResult.error) {
        throw new Error(sameResult.error);
      }

      onDifference(createEntry(sameResult.entry1, sameResult.entry2, sameResult.same, level, relativePath));
    }
  }
}

/**
 * Returns the sorted list of entries in a directory.
 */
async function getEntries(
  absolutePath: string | undefined,
  path: string | undefined,
  searchOptions: SearchOptions,
  loopDetected: boolean
): Promise<Entry[]> {
  if (!absolutePath || loopDetected) {
    return [];
  }

  const stat = await statAsync(absolutePath);

  if (stat.isDirectory()) {
    const rawEntries = await readdirAsync(absolutePath);
    return buildEntries(absolutePath, path, rawEntries, searchOptions);
  } else {
    const name = pathUtils.basename(absolutePath);
    return [{ name, absolutePath, path, stat }];
  }
}

async function buildEntries(
  absolutePath: string,
  path: string,
  rawEntries: string[],
  searchOptions: SearchOptions
): Promise<Entry[]> {
  const entries = await Promise.all(
    rawEntries.map(entryName => buildEntry(absolutePath, path, entryName, searchOptions))
  );
  const filteredEntries = entries.filter(entry => filterEntry(entry, searchOptions));

  // // TODO: Maybe use Array.filter() method
  // const filteredEntries: Entry[] = [];
  // entries.forEach((entry) => {
  //   if (filterEntry(entry, searchOptions)) {
  //     filteredEntries.push(entry);
  //   }
  // });

  return searchOptions.ignoreCase
    ? filteredEntries.sort(compareEntryIgnoreCase)
    : filteredEntries.sort(compareEntryCaseSensitive);
}

async function buildEntry(
  absolutePath: string,
  path: string,
  entryName: string,
  options: SearchOptions
): Promise<Entry> {
  const entryAbsolutePath = fastPathJoin(absolutePath, entryName);
  const entryPath = fastPathJoin(path, entryName);

  const lstat = await lstatAsync(entryAbsolutePath);
  const isSymlink = lstat.isSymbolicLink();
  const stat = options.skipSymlinks && isSymlink ? undefined : await statAsync(entryAbsolutePath);

  return {
    name: entryName,
    absolutePath: entryAbsolutePath,
    path: entryPath,
    stat,
    lstat,
    isSymlink
  };
}

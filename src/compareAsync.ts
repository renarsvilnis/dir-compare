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

  const comparePromises: ReturnType<typeof compareAsyncInternal>[] = [];
  const compareFilePromises: Promise<void>[] = [];

  /**
   * Index of which entry from each group to process, once an entry from a group
   * is processed the groups index variable gets incremented
   */
  let i1 = 0;
  let i2 = 0;

  // Cache entries length property as their length is static
  const entries1LengthCached = entries1.length;
  const entries2LengthCached = entries2.length;

  // Loop while both entries are processed
  while (i1 < entries1LengthCached || i2 < entries2LengthCached) {
    const entry1 = entries1[i1];
    const entry2 = entries2[i2];
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

    // "dry method" because used in two spaces
    const onSame = (isSame: boolean) =>
      onDifference(
        isSame
          ? createEqualDifference(entry1, entry2, level, relativePath)
          : createDistinctDifference(entry1, entry2, level, relativePath)
      );

    // process entry
    if (cmp === 0) {
      // Both left/right exist and have the same name and type
      let same: boolean | undefined = undefined;

      if (type1 === "file") {
        // TODO: maybe convert so that multiple compare "filters" can be applied,
        // as now you need to choose compareSize or compareDate or
        // compareContent, maybe user wants to compare everything
        // TODO: fix type enforce
        if (searchOptions.compareSize && fileStat1!.size !== fileStat2!.size) {
          same = false;
        } else if (
          searchOptions.compareDate &&
          // TODO: fix type enforce
          !sameDate(fileStat1!.mtime, fileStat2!.mtime, searchOptions.dateTolerance)
        ) {
          same = false;
        } else if (searchOptions.compareContent) {
          const compareFile = async (entry1: Entry, entry2: Entry) => {
            const isSame = await searchOptions.compareFile(
              entry1.absolutePath,
              entry1.stat,
              entry2.absolutePath,
              entry2.stat,
              searchOptions
            );
            onSame(isSame);
          };

          compareFilePromises.push(compareFile(entry1, entry2));
        } else {
          same = true;
        }

        // Folder
      } else {
        same = true;
      }

      if (same !== undefined) {
        onSame(same);
      }

      i1++;
      i2++;
      if (!searchOptions.skipSubdirectories && type1 === "directory") {
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
      if (!searchOptions.skipSubdirectories && type1 === "directory") {
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
      if (!searchOptions.skipSubdirectories && type2 === "directory") {
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

    await Promise.all([...comparePromises, ...compareFilePromises]);
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
  if (!absolutePath || !path || loopDetected) {
    return [];
  }

  const stat = await statAsync(absolutePath);

  if (stat.isDirectory()) {
    const rawEntries = await readdirAsync(absolutePath);
    return buildEntries(absolutePath, path, rawEntries, searchOptions);
  } else {
    const name = pathUtils.basename(absolutePath);
    const lstat = await lstatAsync(absolutePath);
    const isSymlink = lstat.isSymbolicLink();
    return [{ name, absolutePath, path, stat, lstat, isSymlink }];
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

  return searchOptions.ignoreCase
    ? filteredEntries.sort(compareEntryIgnoreCase)
    : filteredEntries.sort(compareEntryCaseSensitive);
}

async function buildEntry(
  absolutePath: string,
  path: string,
  entryName: string,
  searchOptions: SearchOptions
): Promise<Entry> {
  const entryAbsolutePath = fastPathJoin(absolutePath, entryName);
  const entryPath = fastPathJoin(path, entryName);

  // const lstat = await lstatAsync(entryAbsolutePath);
  // const isSymlink = lstat.isSymbolicLink();

  // Memory usage optimization if user doesn't want to follow symlinks
  // const stat = searchOptions.skipSymlinks && isSymlink ? undefined : await statAsync(entryAbsolutePath);

  // TODO: for now disable the optimization to make types easier
  const [lstat, stat] = await Promise.all([lstatAsync(entryAbsolutePath), statAsync(entryAbsolutePath)]);
  const isSymlink = lstat.isSymbolicLink();

  return {
    name: entryName,
    absolutePath: entryAbsolutePath,
    path: entryPath,
    stat,
    lstat,
    isSymlink
  };
}

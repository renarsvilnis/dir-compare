/// <reference types="node" />

import * as fs from "fs";

export function compare(path1: string, path2: string, options?: Partial<SearchOptions>): Promise<StatisticResults>;

export type SymlinkCacheGroup = { [key: string]: boolean };
export interface SymlinkCache {
  dir1: SymlinkCacheGroup;
  dir2: SymlinkCacheGroup;
}

export interface CreateEntryOptions {
  entry1: Entry | undefined;
  entry2: Entry | undefined;
  state: DifferenceState;
  level: number;
  relativePath: string;
  options: Partial<SearchOptions>;
}

export type CompareResult = 0 | -1 | 1;

export interface SearchOptions {
  // TODO: improve search options as file compare takes only one option in the
  // following order compareSize -> compareDate -> compareContent

  /**
   * Compares files by size. Defaults to 'false'.
   */
  compareSize: boolean;

  /**
   *  Compares files by date of modification (stat.mtime). Defaults to 'false'.
   */
  compareDate: boolean;

  /**
   * Two files are considered to have the same date if the difference between their modification dates fits within date tolerance. Defaults to 1000 ms.
   */
  dateTolerance: number;

  /**
   *  Compares files by content. Defaults to 'false'.
   */
  compareContent: boolean;

  /**
   * Skips sub directories. Defaults to 'false'.
   */
  skipSubdirectories: boolean;

  /**
   * Ignore symbolic links. Defaults to 'false'.
   */
  skipSymlinks: boolean;

  /**
   * Ignores case when comparing names. Defaults to 'false'.
   */
  ignoreCase: boolean;

  /**
   * File name filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
   */
  includeFilter: string;

  /**
   * File/directory name exclude filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
   */
  excludeFilter: string;

  /**
   * File comparison handler.
   */
  compareFile: CompareFile;

  // TODO: separate specific file compare options from general
  // Only used for lineBasedFileCompare
  ignoreLineEnding: boolean;
  ignoreWhiteSpaces: boolean;
}

export interface Results {
  statistics: StatisticResults;
  differences: Difference[];
}

export interface Entry {
  name: string;
  absolutePath: string;
  path: string;
  stat: fs.Stats;
  lstat: fs.Stats;
  isSymlink: boolean;
}

/**
 * Output format:
 *  distinct: number of distinct entries
 *  equal: number of equal entries
 *  left: number of entries only in path1
 *  right: number of entries only in path2
 *  differences: total number of differences (distinct+left+right)
 *  distinctFiles: number of distinct files
 *  equalFiles: number of equal files
 *  leftFiles: number of files only in path1
 *  rightFiles: number of files only in path2
 *  differencesFiles: total number of different files (distinctFiles+leftFiles+rightFiles)
 *  distinctDirs: number of distinct directories
 *  equalDirs: number of equal directories
 *  leftDirs: number of directories only in path1
 *  rightDirs: number of directories only in path2
 *  differencesDirs: total number of different directories (distinctDirs+leftDirs+rightDirs)
 *  same: true if directories are identical
 *  diffSet - List of changes
 *      path1: absolute path not including file/directory name,
 *      path2: absolute path not including file/directory name,
 *      relativePath: common path relative to root,
 *      name1: file/directory name
 *      name2: file/directory name
 *      state: one of equal, left, right, distinct,
 *      type1: one of missing, file, directory
 *      type2: one of missing, file, directory
 *      size1: file size
 *      size2: file size
 *      date1: modification date (stat.mtime)
 *      date2: modification date (stat.mtime)
 *      level: depth
 */
export interface StatisticResults {
  /**
   * number of distinct entries.
   */
  distinct: number;

  /**
   * number of equal entries.
   */
  equal: number;

  /**
   * number of entries only in path1.
   */
  left: number;

  /**
   * number of entries only in path2.
   */
  right: number;

  /**
   * total number of differences (distinct+left+right).
   */
  differences: number;

  /**
   * number of distinct files.
   */
  distinctFiles: number;

  /**
   * number of equal files.
   */
  equalFiles: number;

  /**
   * number of files only in path1.
   */
  leftFiles: number;

  /**
   * number of files only in path2
   */
  rightFiles: number;

  /**
   * total number of different files (distinctFiles+leftFiles+rightFiles).
   */
  differencesFiles: number;

  /**
   * number of distinct directories.
   */
  distinctDirs: number;

  /**
   * number of equal directories.
   */
  equalDirs: number;

  /**
   * number of directories only in path1.
   */
  leftDirs: number;

  /**
   * number of directories only in path2.
   */
  rightDirs: number;

  /**
   * total number of different directories (distinctDirs+leftDirs+rightDirs).
   */
  differencesDirs: number;

  /**
   * true if directories are identical.
   */
  same: boolean;

  /**
   * Total difference count
   */
  total: number;

  /**
   * Subset of all differences that are files
   */
  totalFiles: number;

  /**
   * Subset of all differences that are folders
   */
  totalDirs: number;
}

export type DifferenceState = "equal" | "left" | "right" | "distinct";
export type DifferenceType = "missing" | "file" | "directory";
export interface DifferenceEqual {
  /**
   * path not including file/directory name; can be relative or absolute depending on call to compare().
   */
  path1: string;

  /**
   * path not including file/directory name; can be relative or absolute depending on call to compare().
   */
  path2: string;

  /**
   * path relative to root.
   */
  relativePath: string;

  /**
   * file/directory name.
   */
  name1: string;

  /**
   * file/directory name.
   */
  name2: string;

  /**
   * one of equal, left, right, distinct.
   */
  state: "equal";

  /**
   * one of missing, file, directory.
   */
  type1: "file" | "directory";

  /**
   * one of missing, file, directory.
   */
  type2: "file" | "directory";

  /**
   * file size.
   */
  size1: number;

  /**
   * file size.
   */
  size2: number;

  /**
   * modification date (stat.mtime).
   */
  date1: number;

  /**
   * modification date (stat.mtime).
   */
  date2: number;

  /**
   * depth.
   */
  level: number;
}

export interface DifferenceDistinct {
  path1: string;
  path2: string;
  relativePath: string;
  name1: string;
  name2: string;
  state: "distinct";
  type1: "file" | "directory";
  type2: "file" | "directory";
  size1: number;
  size2: number;
  date1: number;
  date2: number;
  level: number;
}

export interface DifferenceLeft {
  path1: string;
  path2: undefined;
  relativePath: string;
  name1: string;
  name2: undefined;
  state: "left";
  type1: "file" | "directory";
  type2: "missing";
  size1: number;
  size2: undefined;
  date1: number;
  date2: undefined;
  level: number;
}

export interface DifferenceRight {
  path1: undefined;
  path2: string;
  relativePath: string;
  name1: undefined;
  name2: string;
  state: "right";
  type1: "missing";
  type2: "file" | "directory";
  size1: undefined;
  size2: number;
  date1: undefined;
  date2: number;
  level: number;
}

export type Difference = DifferenceEqual | DifferenceDistinct | DifferenceLeft | DifferenceRight;

export type CompareFile = (
  path1: string,
  stat1: fs.Stats,
  path2: string,
  stat2: fs.Stats,
  options: Partial<SearchOptions>
) => Promise<boolean>;

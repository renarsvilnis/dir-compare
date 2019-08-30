import path from "path";

import { DifferenceLeft, DifferenceRight, DifferenceDistinct, DifferenceEqual, EntryNormal } from "../types";
import { getType } from "../utils";

// TODO: maybe pass type1 as param?
export function createLeftOnlyDifference(entry1: EntryNormal, level: number, relativePath: string): DifferenceLeft {
  return {
    path1: path.dirname(entry1.path),
    path2: undefined,
    relativePath: relativePath,
    name1: entry1.name,
    name2: undefined,
    state: "left",
    type1: getType(entry1.stat),
    type2: "missing",
    size1: entry1.stat.size,
    size2: undefined,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: undefined,
    level
  };
}

// TODO: maybe pass type2 as param?
export function createRightOnlyDifference(entry2: EntryNormal, level: number, relativePath: string): DifferenceRight {
  return {
    path1: undefined,
    path2: path.dirname(entry2.path),
    relativePath: relativePath,
    name1: undefined,
    name2: entry2.name,
    state: "right",
    type1: "missing",
    type2: getType(entry2.stat),
    size1: undefined,
    size2: entry2.stat.size,
    date1: undefined,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date2: entry2.stat.mtimeMs,
    level
  };
}

// TODO: maybe pass type1 and type2 as param?
export function createEqualDifference(
  entry1: EntryNormal,
  entry2: EntryNormal,
  level: number,
  relativePath: string
): DifferenceEqual {
  return {
    path1: path.dirname(entry1.path),
    path2: path.dirname(entry2.path),
    relativePath,
    name1: entry1.name,
    name2: entry2.name,
    state: "equal",
    type1: getType(entry1.stat),
    type2: getType(entry2.stat),
    size1: entry1.stat.size,
    size2: entry2.stat.size,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: entry2.stat.mtimeMs,
    level
  };
}

// TODO: maybe pass type1 and type2 as param?
export function createDistinctDifference(
  entry1: EntryNormal,
  entry2: EntryNormal,
  level: number,
  relativePath: string
): DifferenceDistinct {
  return {
    path1: path.dirname(entry1.path),
    path2: path.dirname(entry2.path),
    relativePath,
    name1: entry1.name,
    name2: entry2.name,
    state: "distinct",
    type1: getType(entry1.stat),
    type2: getType(entry2.stat),
    size1: entry1.stat.size,
    size2: entry2.stat.size,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: entry2.stat.mtimeMs,
    level
  };
}

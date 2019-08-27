import path from "path";

import { Entry, DifferenceLeft, DifferenceRight, DifferenceDistinct, DifferenceEqual } from "../types";
import { getTypeLoose } from "../utils";

export function createLeftOnlyDifference(entry1: Entry, level: number, relativePath: string): DifferenceLeft {
  return {
    path1: path.dirname(entry1.path),
    path2: undefined,
    relativePath: relativePath,
    name1: entry1.name,
    name2: undefined,
    state: "left",
    type1: getTypeLoose(entry1.stat),
    type2: "missing",
    size1: entry1.stat.size,
    size2: undefined,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: undefined,
    level
  };
}

export function createRightOnlyDifference(entry2: Entry, level: number, relativePath: string): DifferenceRight {
  return {
    path1: undefined,
    path2: path.dirname(entry2.path),
    relativePath: relativePath,
    name1: undefined,
    name2: entry2.name,
    state: "right",
    type1: "missing",
    type2: getTypeLoose(entry2.stat),
    size1: undefined,
    size2: entry2.stat.size,
    date1: undefined,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date2: entry2.stat.mtimeMs,
    level
  };
}

export function createEqualDifference(
  entry1: Entry,
  entry2: Entry,
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
    type1: getTypeLoose(entry1.stat),
    type2: getTypeLoose(entry2.stat),
    size1: entry1.stat.size,
    size2: entry2.stat.size,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: entry2.stat.mtimeMs,
    level
  };
}

export function createDistinctDifference(
  entry1: Entry,
  entry2: Entry,
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
    type1: getTypeLoose(entry1.stat),
    type2: getTypeLoose(entry2.stat),
    size1: entry1.stat.size,
    size2: entry2.stat.size,
    // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's better in output
    date1: entry1.stat.mtimeMs,
    date2: entry2.stat.mtimeMs,
    level
  };
}

import path from "path";
import { getType } from "./utils";
import {
  ResultBuilderFn
  // DifferenceRight,
  // DifferenceEqual,
  // DifferenceDistinct,
  // DifferenceLeft,
  // CreateEntryOptions
} from "./types";

const defaultResultBuilderCallback: ResultBuilderFn = (
  entry1,
  entry2,
  state,
  level,
  relativePath,
  options,
  statistics,
  diffSet
) => {
  diffSet.push({
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
};

// const createDistinctEntry = ({
//   entry1,
//   entry2,
//   state,
//   level,
//   relativePath,
//   options,
//   statistics,
//   diffSet
// }: CreateEntryOptions): DifferenceDistinct => ({});
// const createEqualEntry = ({
//   entry1,
//   entry2,
//   state,
//   level,
//   relativePath,
//   options,
//   statistics,
//   diffSet
// }: CreateEntryOptions): DifferenceEqual => ({});
// const createLeftOnlyEntry = ({
//   entry1,
//   entry2,
//   state,
//   level,
//   relativePath,
//   options,
//   statistics,
//   diffSet
// }: CreateEntryOptions): DifferenceLeft => ({
//   path1: undefined,
//   path2: string,
//   relativePath: string,
//   name1: undefined,
//   name2: string,
//   state: "right",
//   type1: "missing",
//   type2: "file" | "directory",
//   size1: undefined,
//   size2: number,
//   date1: undefined,
//   date2: number,
//   level: number
// });
// const createRightOnlyEntry = ({
//   entry1,
//   entry2,
//   state,
//   level,
//   relativePath,
//   options,
//   statistics,
//   diffSet
// }: CreateEntryOptions): DifferenceRight => ({});

export default defaultResultBuilderCallback;

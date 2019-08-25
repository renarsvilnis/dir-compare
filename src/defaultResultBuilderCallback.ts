import pathUtils from "path";
import { getType } from "./utils";
import { ResultBuilderFn } from "./types";

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
  if (diffSet) {
    diffSet.push({
      path1: entry1 ? pathUtils.dirname(entry1.path) : undefined,
      path2: entry2 ? pathUtils.dirname(entry2.path) : undefined,
      relativePath: relativePath,
      name1: entry1 ? entry1.name : undefined,
      name2: entry2 ? entry2.name : undefined,
      state: state,
      type1: entry1 ? getType(entry1.stat) : "missing",
      type2: entry2 ? getType(entry2.stat) : "missing",
      level: level,
      size1: entry1 ? entry1.stat.size : undefined,
      size2: entry2 ? entry2.stat.size : undefined,
      // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's
      // better in output
      // date1: entry1 ? entry1.stat.mtime : undefined,
      // date1: entry1 ? entry1.stat.mtime : undefined,
      date1: entry2 ? entry2.stat.mtimeMs : undefined,
      date2: entry2 ? entry2.stat.mtimeMs : undefined
    });
  }
};

export default defaultResultBuilderCallback;

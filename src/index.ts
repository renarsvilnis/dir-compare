import dirCompare from "./dirCompare";
import defaultFileCompare from "./fileCompareHandlers/defaultFileCompare";
import lineBasedFileCompare from "./fileCompareHandlers/lineBasedFileCompare";

export default dirCompare;

export const fileCompareHandlers = {
  defaultFileCompare,
  lineBasedFileCompare
};

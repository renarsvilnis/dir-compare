import { SearchOptions } from "../src/types";
import { fileCompareHandlers } from "../src";

export interface Test {
  // Test name. This represents also the name of the file holding expected result unless overridden by 'expected' param.
  name: string;
  path1: string;
  path2: string;
  // Short test description.
  description?: string;
  // Expected result.
  expected?: string;
  // Left/right dirs will be relative to current process.
  withRelativePath?: boolean;
  // Options sent to library test. Should match 'commandLineOptions.
  options?: Partial<SearchOptions>;

  // TODO: remove
  // Options sent to command line test. Should match 'options'.
  commandLineOptions?: string;
  // // Command line expected exit code.
  // exitCode?: number;
  exitCode?: 0 | 1;
  onlyCommandLine?: boolean;
}

export function getTests(testDirPath: string): Test[] {
  return [
    {
      name: "test001_1",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true }
    },
    {
      name: "test001_3",
      path1: "d3",
      path2: "d4",
      options: { compareSize: true }
    },
    {
      name: "test001_4",
      path1: "d4",
      path2: "d4",
      options: { compareSize: true }
    },
    {
      name: "test001_5",
      path1: "d8",
      path2: "d9",
      options: { compareSize: true }
    },
    {
      name: "test001_6",
      path1: "d8",
      path2: "d9",
      options: { compareSize: true }
    },
    {
      name: "test001_8",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true },
      exitCode: 1
    },
    {
      name: "test001_9",
      path1: "d1/a1.txt",
      path2: "d2/a1.txt",
      description: "should compare two files",
      options: { compareSize: true }
    },
    {
      name: "test001_10",
      path1: testDirPath + "/d1",
      path2: testDirPath + "/none",
      description: "should propagate async exception"
    },

    ////////////////////////////////////////////////////
    // Filters                                        //
    ////////////////////////////////////////////////////
    {
      name: "test002_0",
      path1: "d6",
      path2: "d7",
      options: { compareSize: true, includeFilter: "*.e1" },
      commandLineOptions: '-a -f "*.e1"',
      exitCode: 1
    },
    {
      name: "test002_1",
      path1: "d1",
      path2: "d10",
      options: { compareSize: true, excludeFilter: ".x" },
      commandLineOptions: "-aw -x .x",
      exitCode: 1
    },
    {
      name: "test002_2",
      path1: "d6",
      path2: "d7",
      options: { compareSize: true, includeFilter: "*.e1" },
      commandLineOptions: '-aw -f "*.e1"',
      exitCode: 1
    },
    {
      name: "test002_3",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true, excludeFilter: "*.txt" },
      commandLineOptions: '-a -x "*.txt"',
      exitCode: 1
    },
    {
      name: "test002_4",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true, excludeFilter: "*.txt" },
      commandLineOptions: '-aw -x "*.txt"',
      exitCode: 1
    },
    {
      name: "test002_5",
      path1: "d6",
      path2: "d7",
      options: { compareSize: true, excludeFilter: "*.e1,*.e2" },
      commandLineOptions: '-a -x "*.e1,*.e2"',
      exitCode: 1
    },
    {
      name: "test002_6",
      path1: "d6",
      path2: "d7",
      options: { compareSize: true, excludeFilter: "*.e1,*.e2" },
      commandLineOptions: '-aw -x "*.e1,*.e2"',
      exitCode: 1
    },
    // TODO: test both --exclude and --filter in the same run

    ////////////////////////////////////////////////////
    // Compare by content                             //
    ////////////////////////////////////////////////////
    // TODO: add test with compareSize: false, compareContent: true
    {
      name: "test003_0",
      path1: "d11",
      path2: "d12",
      options: { compareSize: true, compareContent: true },
      commandLineOptions: "-ac",
      exitCode: 1
    },
    {
      name: "test003_1",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true, compareContent: true },
      commandLineOptions: "-awc",
      exitCode: 1
    },
    ////////////////////////////////////////////////////
    // Symlinks                                      //
    ////////////////////////////////////////////////////
    {
      name: "test005_0",
      path1: "d13",
      path2: "d14",
      options: { compareSize: true, skipSymlinks: true },
      commandLineOptions: "-awL",
      exitCode: 1
    },
    {
      name: "test005_1",
      path1: "d17",
      path2: "d17",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_1_1",
      path1: "d17",
      path2: "d17",
      withRelativePath: true,
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_2",
      path1: "d17",
      path2: "d17",
      options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
      commandLineOptions: "-awL",
      exitCode: 0
    },
    {
      name: "test005_3",
      path1: "d17",
      path2: "d18",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_4",
      path1: "d22",
      path2: "d22",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_5",
      path1: "d19",
      path2: "d19",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_5_1",
      path1: "d19",
      path2: "d19",
      withRelativePath: true,
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_6",
      path1: "d19",
      path2: "d19",
      options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
      commandLineOptions: "-awL",
      exitCode: 0
    },
    {
      name: "test005_7",
      path1: "d20",
      path2: "d20",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_8",
      path1: "d21",
      path2: "d21",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_9",
      path1: "d20",
      path2: "d21",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_10",
      path1: "d21",
      path2: "d20",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_11",
      path1: "d20",
      path2: "d22",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_12",
      path1: "d22",
      path2: "d20",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_13",
      path1: "d23",
      path2: "d23",
      description: "be able to compare symlinks to files",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_14",
      path1: "d24",
      path2: "d24",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_15",
      path1: "d25",
      path2: "d25",
      description: "do not fail when missing symlinks are encountered and skip",
      options: { compareSize: true, ignoreCase: true, skipSymlinks: true }
    },
    {
      name: "test005_16",
      path1: "d26",
      path2: "d27",
      description: "detect symbolic link loops; loops span between left/right directories",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 1
    },
    {
      name: "test005_17",
      path1: "d28",
      path2: "d28",
      description: "detect symbolic link loops; loop back to root directory",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_18",
      path1: "d29",
      path2: "d30",
      description: "compare two symlinks",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },
    {
      name: "test005_19",
      path1: "d34_symlink/d",
      path2: "d34_symlink/d",
      options: { compareSize: true, ignoreCase: true },
      exitCode: 0
    },

    ////////////////////////////////////////////////////
    // Skip subdirs                                   //
    ////////////////////////////////////////////////////
    {
      name: "test006_0",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true, skipSubdirectories: true },
      commandLineOptions: "-aS",
      exitCode: 1
    },
    {
      name: "test006_1",
      path1: "d1",
      path2: "d2",
      options: { compareSize: true, skipSubdirectories: true },
      commandLineOptions: "-awS",
      exitCode: 1
    },
    ////////////////////////////////////////////////////
    // Ignore case                                    //
    ////////////////////////////////////////////////////
    {
      name: "test007_0",
      path1: "d15",
      path2: "d16",
      options: { compareSize: true, ignoreCase: true },
      commandLineOptions: "-awi",
      exitCode: 0
    },
    {
      name: "test007_1",
      path1: "d15",
      path2: "d16",
      options: { compareSize: true, ignoreCase: false },
      exitCode: 1
    },
    ////////////////////////////////////////////////////
    // Options handling                               //
    ////////////////////////////////////////////////////
    {
      name: "test008_1",
      path1: "d1",
      path2: "d2",
      expected: "total: 17, equal: 3, distinct: 0, only left: 7, only right: 7",
      options: {}
    },
    {
      name: "test008_2",
      path1: "d1",
      path2: "d2",
      expected: "total: 17, equal: 3, distinct: 0, only left: 7, only right: 7",
      options: undefined
    },
    ////////////////////////////////////////////////////
    // Compare date                                   //
    ////////////////////////////////////////////////////
    {
      name: "test010_0",
      path1: "d31",
      path2: "d32",
      options: { compareSize: true, compareDate: false },
      exitCode: 0
    },
    {
      name: "test010_1",
      path1: "d31",
      path2: "d32",
      options: { compareSize: true, compareDate: true },
      commandLineOptions: "-awD",
      exitCode: 1
    },
    {
      name: "test010_2",
      path1: "d31",
      path2: "d32",
      options: { compareSize: true, compareDate: false, compareContent: true },
      commandLineOptions: "-awc",
      exitCode: 1
    },
    {
      name: "test010_3",
      path1: "d31",
      path2: "d32",
      options: { compareSize: true, compareDate: true, compareContent: true },
      commandLineOptions: "-awcD",
      exitCode: 1
    },
    {
      name: "test010_4",
      path1: "d33/1",
      path2: "d33/2",
      description: "should correctly use tolerance in date comparison",
      options: { compareSize: true, compareDate: true, dateTolerance: 5000 },
      commandLineOptions: "-awD --date-tolerance 5000",
      exitCode: 1
    },
    {
      name: "test010_5",
      path1: "d33/1",
      path2: "d33/2",
      description: "should correctly use tolerance in date comparison",
      options: { compareSize: true, compareDate: true, dateTolerance: 9000 },
      commandLineOptions: "-awD --date-tolerance 9000",
      exitCode: 0
    },
    {
      name: "test010_6",
      path1: "d33/1",
      path2: "d33/2",
      description: "should default to 1000 ms for date tolerance",
      options: { compareSize: true, compareDate: true },
      commandLineOptions: "-awD",
      exitCode: 1
    },
    ////////////////////////////////////////////////////
    // Line by line compare                           //
    ////////////////////////////////////////////////////
    {
      name: "test011_1",
      path1: "d35/crlf-spaces",
      path2: "d35/lf-spaces",
      description: "should ignore line endings",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreLineEnding: true
      }
    },
    {
      name: "test011_2",
      path1: "d35/crlf-spaces",
      path2: "d35/lf-spaces",
      description: "should not ignore line endings",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreLineEnding: false
      }
    },
    {
      name: "test011_3",
      path1: "d35/lf-spaces",
      path2: "d35/lf-tabs",
      description: "should ignore white spaces",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreWhiteSpaces: true
      }
    },
    {
      name: "test011_4",
      path1: "d35/crlf-spaces",
      path2: "d35/lf-tabs",
      description: "should ignore white spaces and line endings",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreLineEnding: true,
        ignoreWhiteSpaces: true
      }
    },
    {
      name: "test011_5",
      path1: "d35/lf-spaces",
      path2: "d35/lf-tabs",
      description: "should not ignore white spaces",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreWhiteSpaces: false
      }
    },
    {
      name: "test011_6",
      path1: "d35/lf-spaces",
      path2: "d35/lf-mix",
      description: "should ignore mixed white spaces",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreWhiteSpaces: true
      }
    },
    {
      name: "test011_7",
      path1: "d35/lf-tabs",
      path2: "d35/lf-mix",
      description: "should ignore mixed white spaces",
      options: {
        compareContent: true,
        compareFile: fileCompareHandlers.lineBasedFileCompare,
        ignoreWhiteSpaces: true
      }
    },
    ////////////////////////////////////////////////////
    // Relative paths                                 //
    ////////////////////////////////////////////////////
    {
      name: "test012_0",
      path1: "d1",
      path2: "d2",
      description: "should report relative paths",
      options: {},
      withRelativePath: true
      // print: printRelativePathResult
    },
    {
      name: "test012_1",
      path1: "d1/A6/../../d1",
      path2: "d2",
      description: "should report absolute paths",
      options: {},
      withRelativePath: false
      // print: printRelativePathResult
    },
    {
      name: "test012_2",
      path1: testDirPath + "/d1",
      path2: "d2",
      description: "should report absolute and relative paths",
      options: {},
      withRelativePath: true
      // print: printRelativePathResult
    }
  ];
}

// function printRelativePathResult(res, testDirPath: string, writer) {
//   var result = res.diffSet.map(diff => {
//     return util.format("path1: %s, path2: %s", diff.path1, diff.path2);
//   });
//   result = JSON.stringify(result);
//   result = result.replace(/\\\\/g, "/");
//   result = result.replace(new RegExp(testDirPath.replace(/\\/g, "/"), "g"), "absolute_path");
//   writer.write(result);
// }

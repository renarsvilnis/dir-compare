import fs from "fs";
import temp from "temp";
import each from "jest-each";
import deasync from "deasync";

import { getTests, Test } from "./tests";
import dirCompare, { DEFAULT_OPTIONS } from "../src";
import untar from "./untar";
import { SearchOptions, Results } from "../src/types";

const untarSync = deasync(untar);

// Use ./testdir instead of testdir.tar as test data.
// Run 'node extract.js' to initialize ./testdir.
// (note that regular untar will not work as it contains symlink loops)
// Previously through passed in trough cli
const unpacked = true;

if (unpacked) {
  executeTests(__dirname + "/testdir");
} else {
  const testDirPath = temp.mkdirSync("dircompare-test");
  console.log("Unpacking");
  untarSync(__dirname + "/testdir.tar", testDirPath);
  console.log("Unpacked");
  executeTests(testDirPath);
}

// testDirPath: path to test data
// singleTestName: if defined, represents the test name to be executed in format
//                 otherwise all tests are executed
function executeTests(testDirPath: string) {
  beforeAll(() => {
    // Automatically track and clean up files at exit
    temp.track();
  });

  const rawTests = getTests(testDirPath);
  const tests = rawTests.map(t => {
    let name = t.name;
    if (t.description) {
      name += ` - ${t.description}`;
    }
    return [name, t] as [string, Test];
  });

  each(tests).test("%s", async (name, testObj, done) => {
    expect.hasAssertions();

    process.chdir(testDirPath);

    const path1 = testObj.withRelativePath ? testObj.path1 : testDirPath + "/" + testObj.path1;
    const path2 = testObj.withRelativePath ? testObj.path2 : testDirPath + "/" + testObj.path2;

    // let promise;
    // if (test.runAsync) {
    //   promise = test.runAsync().then((result) => {
    //     return { output: result };
    //   });
    // } else {
    //   promise = dirCompare(path1, path2, test.options).then((result) => {
    //     const writer = new Streams.WritableStream();
    //     const print = test.print ? test.print : defaultPrint;
    //     print(result, writer, test.displayOptions);
    //     const output = normalize(writer.toString()).trim();
    //     return { output: output };
    //   });
    // }

    const options: SearchOptions = { ...DEFAULT_OPTIONS, ...testObj.options };
    const results = await dirCompare(path1, path2, options).then(result => ({
      output: result
    }));

    // const output = result.output;
    // const statisticsCheck = result.statisticsCheck;
    const expected = getExpected(testObj);

    const whatIGot = formatResultsForExpect(results.output);
    // console.log(whatIGot);

    // const res = expected === output && statisticsCheck;
    // console.log(test.name + " async: " + passed(res));

    expect(whatIGot).toBe(expected);

    done();
  });

  afterAll(() => {
    // allow temp dir to be removed
    process.chdir(__dirname);
  });
}

//Matches date (ie 2014-11-18T21:32:39.000Z)
const normalizeDateRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gm;

function normalize(str: string): string {
  str = str.replace(normalizeDateRegexp, "x");
  str = str.replace(/\r\n/g, "\n");
  str = str.replace(/\\/g, "/");
  return str;
}

function getExpected(test: Test) {
  if (test.expected) {
    return test.expected.trim();
  } else {
    return normalize(fs.readFileSync(__dirname + "/expected/" + test.name + ".txt", "utf8")).trim();
  }
}

/**
 * Helper function to format the dircompare output in a more human readable
 * output that is easier to write expected results from.
 *
 * Example output:
 * [/] A10->missing(directory)
 * [/] missing<-A11(directory)
 * [/A11] missing<-a2.txt(file)
 * [/] A6==A6(directory)
 * [/A6] a1.txt->missing(file)
 * [/A6] missing<-a3.txt(file)
 * [/] A7->missing(directory)
 * [/A7] a1.txt->missing(file)
 * [/] missing<-A8(directory)
 * [/A8] missing<-a1.txt(file)
 * [/] missing<-A9(directory)
 * [/] A11->missing(file)
 * [/] a1.txt==a1.txt(file)
 * [/] a2.txt<>a2.txt(file)
 * [/] a3.txt->missing(file)
 * [/] missing<-a4.txt(file)
 * [/] a5.txt->missing(file)
 * Entries are different
 * total: 17, equal: 2, distinct: 1, only left: 7, only right: 7
 */
function formatResultsForExpect(results: Results): string {
  const output: string[] = [];
  results.differences.forEach(diff => {
    let symbol;

    switch (diff.state) {
      case "distinct": {
        symbol = "<>";
        break;
      }
      case "equal": {
        symbol = "==";
        break;
      }
      case "left": {
        symbol = "->";
        break;
      }
      case "right": {
        symbol = "<-";
        break;
      }
    }

    output.push(
      `[${diff.relativePath || "/"}] ${diff.name1 || "missing"}${symbol}${diff.name2 || "missing"}(${
        diff.type1 !== "missing" ? diff.type1 : diff.type2
      })`
    );
  });

  output.push(results.statistics.differences ? "Entries are different" : "Entries are identical");
  output.push(
    `total: ${results.statistics.total}, equal: ${results.statistics.equal}, distinct: ${results.statistics.distinct}, only left: ${results.statistics.left}, only right: ${results.statistics.right}`
  );

  return output.join("\n");
}

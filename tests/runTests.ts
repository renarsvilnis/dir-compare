import fs from "fs";
import temp from "temp";

import { getTests, Test } from "./tests";
import dirCompare from "../src";
import untar from "./untar";

let failed = 0;

// Automatically track and cleanup files at exit
temp.track();

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

function testAsync(test: Test, testDirPath: string) {
  process.chdir(testDirPath);
  let path1, path2;
  if (test.withRelativePath) {
    path1 = test.path1;
    path2 = test.path2;
  } else {
    path1 = test.path1 ? testDirPath + "/" + test.path1 : "";
    path2 = test.path2 ? testDirPath + "/" + test.path2 : "";
  }
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

  const promise = dirCompare(path1, path2, test.options).then(result => ({
    output: result
  }));

  return promise.then(
    function(result) {
      // const output = result.output;
      // const statisticsCheck = result.statisticsCheck;
      const expected = getExpected(test);

      // const res = expected === output && statisticsCheck;
      // console.log(test.name + " async: " + passed(res));

      expect(result.output).toBe(expected);
    },
    function(error) {
      // const printError = err => (err instanceof Error ? err.stack : err);
      // console.log(test.name + " async: " + passed(false) + ". Error: " + printError(error));
    }
  );
}

// testDirPath: path to test data
// singleTestName: if defined, represents the test name to be executed in format
//                 otherwise all tests are executed
async function executeTests(testDirPath: string) {
  const tests = getTests(testDirPath);

  const promises = tests.map(test => testAsync(test, testDirPath));
  await Promise.all(promises);

  process.exitCode = failed > 0 ? 1 : 0;
  process.chdir(__dirname); // allow temp dir to be removed
}

// Use ./testdir instead of testdir.tar as test data.
// Run 'node extract.js' to initialize ./testdir.
// (note that regular untar will not work as it contains symlink loops)
// Previously through passed in trough cli
const unpacked = false;

if (unpacked) {
  executeTests(__dirname + "/testdir");
} else {
  const testDirPath = temp.mkdirSync("dircompare-test");

  untar(
    __dirname + "/testdir.tar",
    testDirPath,
    () => {
      executeTests(testDirPath);
    },
    err => {
      console.error("Error occurred:", err);
    }
  );
}

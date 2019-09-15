import os from "os";

import dircompare, { DEFAULT_OPTIONS } from "../../src";
import { Results } from "../../src/types";

const options = {
  ...DEFAULT_OPTIONS,
  compareContent: "true"
};

const path1 = `/${os.tmpdir()}/linux-4.3`;
const path2 = `/${os.tmpdir()}/linux-4.4`;
const noTests = 10000;
const results: { res1: undefined | Results } = { res1: undefined };
let promise = Promise.resolve();
let t1: number | undefined;

(function run() {
  for (let i = 0; i < noTests; i++) {
    promise = promise
      .then(res1 => {
        results.res1 = res1;
        t1 = new Date().getTime();
        return dircompare(path1, path2, options).catch(error => console.log(`error occurred: ${error}`));
      })
      .then(res2 => {
        res1 = results.res1;
        if (res1) {
          const t2 = new Date().getTime();
          console.log(`${i} ${(t2 - t1) / 1000}s`);
          const res1s = JSON.stringify(res1);
          const res2s = JSON.stringify(res2);
          if (res1s !== res2s) {
            console.log("failed");
          }
        }
        return res2;
      });
  }
  promise.then(result => {
    console.log(`ok`);
  });
})();

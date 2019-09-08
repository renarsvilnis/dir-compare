import path from "path";

import untar from "./untar";

const outputDirectory = path.join(__dirname, "testdir");
const outputName = "testdir.tar";

untar(
  path.join(__dirname, outputName),
  outputDirectory,
  () => {
    console.log("Extracted test data into:", outputDirectory);
  },
  (err: Error) => {
    console.log("Error occurred: ", err);
  }
);

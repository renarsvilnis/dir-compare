import path from "path";

import untar from "./untar";

const outputDirectory = path.join(__dirname, "testdir");
const outputName = "testdir.tar";

try {
  untar(path.join(__dirname, outputName), outputDirectory);
  console.log("Extracted test data into:", outputDirectory);
} catch (err) {
  console.log("Error occurred: ", err);
}

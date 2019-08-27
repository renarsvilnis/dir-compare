import path from "path";

import untar from "./untar";

const outdir = path.join(__dirname, "testdir");
const outname = "testdir.tar";

untar(
  path.join(__dirname, outname),
  outdir,
  () => {
    console.log("Extracted test data into:", outdir);
  },
  (err: Error) => {
    console.log("Error occurred: ", err);
  }
);

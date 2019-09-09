import tar from "tar-fs";
import fs from "fs";
import path from "path";

// @types/tar-js missing Headers.linkname string property
// interface FixedHeaders extends tar.Headers {
//   linkname: string;
// }

export default function untar(tarFile: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const extractLinks = () => {
      const linkExtractor = tar
        .extract(output, {
          // TODO: temporary opt out of types for "header"
          // ignore: (name, header: FixedHeaders) => {
          ignore: (name, header: any) => {
            // use the 'ignore' handler for symlink creation.
            if (header && header.type === "symlink") {
              let target;
              if (process.platform === "win32") {
                // Absolute symlinks
                target = path.join(output, path.dirname(header.name), header.linkname);
              } else {
                // Relative symlinks
                target = header.linkname;
              }

              const linkPath = path.join(output, header.name);
              if (!fs.existsSync(linkPath)) {
                if (fs.existsSync(target)) {
                  const statTarget = fs.statSync(target);
                  if (statTarget.isFile()) {
                    fs.symlinkSync(target, linkPath, "file");
                  } else if (statTarget.isDirectory()) {
                    fs.symlinkSync(target, linkPath, "junction");
                  } else {
                    throw "unsupported";
                  }
                } else {
                  fs.symlinkSync(target, linkPath, "junction");
                }
              }
            }
            return true;
          }
        })
        .on("error", reject)
        .on("finish", resolve);
      fs.createReadStream(tarFile)
        .on("error", reject)
        .pipe(linkExtractor);
    };

    const fileExtractor = tar
      .extract(output, {
        ignore: (name, header) => (header && header.type === "symlink" ? true : false)
      })
      .on("error", reject)
      .on("finish", extractLinks);
    fs.createReadStream(tarFile)
      .on("error", reject)
      .pipe(fileExtractor);
  });
}

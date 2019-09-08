import tar from "tar-fs";
import fs from "fs";
import path from "path";

// @types/tar-js missing Headers.linkname string property
interface FixedHeaders extends tar.Headers {
  linkname: string;
}

export default function untar(tarFile: string, output: string, onExtracted: () => void, onError: (err: Error) => void) {
  const extractLinks = () => {
    const linkExtractor = tar
      .extract(output, {
        ignore: (name, header: FixedHeaders) => {
          // use the 'ignore' handler for symlink creation.
          if (header && header.type === "symlink") {
            let target;
            if (process.platform === "win32") {
              // Absolute symlinks
              target = path.join(output, path.dirname(header.name), header.linkname);
            } else {
              // Relative symlinks
              target = header.linkname as string;
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
      .on("error", onError)
      .on("finish", onExtracted);
    fs.createReadStream(tarFile)
      .on("error", onError)
      .pipe(linkExtractor);
  };

  const fileExtractor = tar
    .extract(output, {
      ignore: (name, header) => (header && header.type === "symlink" ? true : false)
    })
    .on("error", onError)
    .on("finish", extractLinks);
  fs.createReadStream(tarFile)
    .on("error", onError)
    .pipe(fileExtractor);
}

import FileDescriptorQueue from "../utils/FileDescriptorQueue";

export function closeFilesAsync(fd1: number | undefined, fd2: number | undefined, fdQueue: FileDescriptorQueue) {
  if (fd1) {
    fdQueue.close(fd1, err => {
      // TODO: what to do?
      if (err) {
        console.log(err);
      }
    });
  }
  if (fd2) {
    fdQueue.close(fd2, err => {
      // TODO: what to do?
      if (err) {
        console.log(err);
      }
    });
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var bluebird_1 = __importDefault(require("bluebird"));
function wrapper(fdQueue) {
    return {
        open: bluebird_1.default.promisify(fdQueue.open),
        read: bluebird_1.default.promisify(fs_1.default.read)
    };
}
exports.wrapper = wrapper;
function closeFilesAsync(fd1, fd2, fdQueue) {
    if (fd1) {
        fdQueue.close(fd1, function (err) {
            // TODO: what to do?
            if (err) {
                console.log(err);
            }
        });
    }
    if (fd2) {
        fdQueue.close(fd2, function (err) {
            // TODO: what to do?
            if (err) {
                console.log(err);
            }
        });
    }
}
exports.closeFilesAsync = closeFilesAsync;
//# sourceMappingURL=common.js.map
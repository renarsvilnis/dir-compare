"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var utils_1 = require("./utils");
var defaultResultBuilderCallback = function (entry1, entry2, state, level, relativePath, options, statistics, diffSet) {
    if (diffSet) {
        diffSet.push({
            path1: entry1 ? path_1.default.dirname(entry1.path) : undefined,
            path2: entry2 ? path_1.default.dirname(entry2.path) : undefined,
            relativePath: relativePath,
            name1: entry1 ? entry1.name : undefined,
            name2: entry2 ? entry2.name : undefined,
            state: state,
            type1: entry1 ? utils_1.getType(entry1.stat) : "missing",
            type2: entry2 ? utils_1.getType(entry2.stat) : "missing",
            level: level,
            size1: entry1 ? entry1.stat.size : undefined,
            size2: entry2 ? entry2.stat.size : undefined,
            // TODO: before rewrite was mtime, now moved to mtimeMs, not sure what's
            // better in output
            // date1: entry1 ? entry1.stat.mtime : undefined,
            // date1: entry1 ? entry1.stat.mtime : undefined,
            date1: entry2 ? entry2.stat.mtimeMs : undefined,
            date2: entry2 ? entry2.stat.mtimeMs : undefined
        });
    }
};
exports.default = defaultResultBuilderCallback;
//# sourceMappingURL=defaultResultBuilderCallback.js.map
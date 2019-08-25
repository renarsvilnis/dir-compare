"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var bluebird_1 = __importDefault(require("bluebird"));
var utils_1 = require("./utils");
var statAsync = bluebird_1.default.promisify(fs_1.default.stat);
var readdirAsync = bluebird_1.default.promisify(fs_1.default.readdir);
// TODO: migrate to path.join()?
var PATH_SEP = path_1.default.sep;
/**
 * Compares two directories asynchronously.
 */
function compareAsync(rootEntry1, rootEntry2, level, relativePath, options, statistics, diffSet, symlinkCache) {
    var loopDetected1 = utils_1.detectLoop(rootEntry1, symlinkCache.dir1);
    var loopDetected2 = utils_1.detectLoop(rootEntry2, symlinkCache.dir2);
    if (rootEntry1 && !loopDetected1) {
        var symlinkCachePath1 = rootEntry1.symlink ? fs_1.default.realpathSync(rootEntry1.absolutePath) : rootEntry1.absolutePath;
        symlinkCache.dir1[symlinkCachePath1] = true;
    }
    if (rootEntry2 && !loopDetected2) {
        var symlinkCachePath2 = rootEntry2.symlink ? fs_1.default.realpathSync(rootEntry2.absolutePath) : rootEntry2.absolutePath;
        symlinkCache.dir2[symlinkCachePath2] = true;
    }
    var absolutePath1 = rootEntry1 ? rootEntry1.absolutePath : undefined;
    var absolutePath2 = rootEntry2 ? rootEntry2.absolutePath : undefined;
    var path1 = rootEntry1 ? rootEntry1.path : undefined;
    var path2 = rootEntry2 ? rootEntry2.path : undefined;
    return bluebird_1.default.all([
        getEntries(absolutePath1, path1, options, loopDetected1),
        getEntries(absolutePath2, path2, options, loopDetected2)
    ]).then(function (entriesResult) {
        var entries1 = entriesResult[0];
        var entries2 = entriesResult[1];
        var i1 = 0;
        var i2 = 0;
        var comparePromises = [];
        var compareFilePromises = [];
        var _loop_1 = function () {
            var entry1 = entries1[i1];
            var entry2 = entries2[i2];
            //   const n1 = entry1 ? entry1.name : undefined;
            //   const n2 = entry2 ? entry2.name : undefined;
            var p1 = entry1 ? entry1.absolutePath : undefined;
            var p2 = entry2 ? entry2.absolutePath : undefined;
            var fileStat1 = entry1 ? entry1.stat : undefined;
            var fileStat2 = entry2 ? entry2.stat : undefined;
            var type1 = void 0, type2 = void 0;
            // compare entry name (-1, 0, 1)
            var cmp = void 0;
            if (i1 < entries1.length && i2 < entries2.length) {
                cmp = options.ignoreCase ? utils_1.compareEntryIgnoreCase(entry1, entry2) : utils_1.compareEntryCaseSensitive(entry1, entry2);
                type1 = utils_1.getType(fileStat1);
                type2 = utils_1.getType(fileStat2);
            }
            else if (i1 < entries1.length) {
                type1 = utils_1.getType(fileStat1);
                type2 = utils_1.getType(undefined);
                cmp = -1;
            }
            else {
                type1 = utils_1.getType(undefined);
                type2 = utils_1.getType(fileStat2);
                cmp = 1;
            }
            // process entry
            if (cmp === 0) {
                // Both left/right exist and have the same name and type
                samePromise = undefined, same = undefined;
                if (type1 === "file") {
                    if (options.compareSize && fileStat1.size !== fileStat2.size) {
                        same = false;
                    }
                    else if (options.compareDate && !utils_1.sameDate(fileStat1.mtime, fileStat2.mtime, options.dateTolerance)) {
                        same = false;
                    }
                    else if (options.compareContent) {
                        cmpFile = function (entry1, entry2, type1, type2) {
                            var subDiffSet;
                            if (!options.noDiffSet) {
                                subDiffSet = [];
                                diffSet.push(subDiffSet);
                            }
                            samePromise = options
                                .compareFileAsync(p1, fileStat1, p2, fileStat2, options)
                                .then(function (comparisonResult) {
                                var same, error;
                                if (typeof comparisonResult === "boolean") {
                                    same = comparisonResult;
                                }
                                else {
                                    error = comparisonResult;
                                }
                                return {
                                    entry1: entry1,
                                    entry2: entry2,
                                    same: same,
                                    error: error,
                                    type1: type1,
                                    type2: type2,
                                    diffSet: subDiffSet
                                };
                            });
                        };
                        cmpFile(entry1, entry2, type1, type2);
                    }
                    else {
                        same = true;
                    }
                }
                else {
                    same = true;
                }
                if (same !== undefined) {
                    doStats(entry1, entry2, same, statistics, options, level, relativePath, diffSet, type1, type2);
                }
                else {
                    compareFilePromises.push(samePromise);
                }
                i1++;
                i2++;
                if (!options.skipSubdirs && type1 === "directory") {
                    if (!options.noDiffSet) {
                        subDiffSet = [];
                        diffSet.push(subDiffSet);
                    }
                    comparePromises.push(compareAsync(entry1, entry2, level + 1, relativePath + PATH_SEP + entry1.name, options, statistics, subDiffSet, utils_1.cloneSymlinkCache(symlinkCache)));
                }
            }
            else if (cmp < 0) {
                // Right missing
                if (!options.noDiffSet) {
                    options.resultBuilder(entry1, undefined, "left", level, relativePath, options, statistics, diffSet);
                }
                statistics.left++;
                if (type1 === "file") {
                    statistics.leftFiles++;
                }
                else {
                    statistics.leftDirs++;
                }
                i1++;
                if (type1 === "directory" && !options.skipSubdirs) {
                    if (!options.noDiffSet) {
                        subDiffSet = [];
                        diffSet.push(subDiffSet);
                    }
                    comparePromises.push(compareAsync(entry1, undefined, level + 1, relativePath + PATH_SEP + entry1.name, options, statistics, subDiffSet, utils_1.cloneSymlinkCache(symlinkCache)));
                }
            }
            else {
                // Left missing
                if (!options.noDiffSet) {
                    subDiffSet = [];
                    diffSet.push(subDiffSet);
                    options.resultBuilder(undefined, entry2, "right", level, relativePath, options, statistics, subDiffSet);
                }
                statistics.right++;
                if (type2 === "file") {
                    statistics.rightFiles++;
                }
                else {
                    statistics.rightDirs++;
                }
                i2++;
                if (type2 === "directory" && !options.skipSubdirs) {
                    if (!options.noDiffSet) {
                        subDiffSet = [];
                        diffSet.push(subDiffSet);
                    }
                    comparePromises.push(compareAsync(undefined, entry2, level + 1, relativePath + PATH_SEP + entry2.name, options, statistics, subDiffSet, utils_1.cloneSymlinkCache(symlinkCache)));
                }
            }
        };
        var samePromise, same, cmpFile, subDiffSet, subDiffSet, subDiffSet, subDiffSet;
        while (i1 < entries1.length || i2 < entries2.length) {
            _loop_1();
        }
        return bluebird_1.default.all(comparePromises).then(function () {
            return bluebird_1.default.all(compareFilePromises).then(function (sameResults) {
                for (var i = 0; i < sameResults.length; i++) {
                    var sameResult = sameResults[i];
                    if (sameResult.error) {
                        return bluebird_1.default.reject(sameResult.error);
                    }
                    else {
                        doStats(sameResult.entry1, sameResult.entry2, sameResult.same, statistics, options, level, relativePath, sameResult.diffSet, sameResult.type1, sameResult.type2);
                    }
                }
            });
        });
    });
}
exports.default = compareAsync;
/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(absolutePath, path, options, loopDetected) {
    if (!absolutePath || loopDetected) {
        return bluebird_1.default.resolve([]);
    }
    else {
        return statAsync(absolutePath).then(function (statPath) {
            if (statPath.isDirectory()) {
                return readdirAsync(absolutePath).then(function (rawEntries) {
                    return buildEntries(absolutePath, path, rawEntries, options);
                });
            }
            else {
                var name = path_1.default.basename(absolutePath);
                return [
                    {
                        name: name,
                        absolutePath: absolutePath,
                        path: path,
                        stat: statPath
                    }
                ];
            }
        });
    }
}
function buildEntries(absolutePath, path, rawEntries, options) {
    var promisedEntries = [];
    rawEntries.forEach(function (entryName) {
        promisedEntries.push(buildEntry(absolutePath, path, entryName, options));
    });
    return bluebird_1.default.all(promisedEntries).then(function (entries) {
        var result = [];
        entries.forEach(function (entry) {
            if (utils_1.filterEntry(entry, options)) {
                result.push(entry);
            }
        });
        return options.ignoreCase ? result.sort(utils_1.compareEntryIgnoreCase) : result.sort(utils_1.compareEntryCaseSensitive);
    });
}
function buildEntry(absolutePath, path, entryName, options) {
    var entryAbsolutePath = absolutePath + PATH_SEP + entryName;
    var entryPath = path + PATH_SEP + entryName;
    return bluebird_1.default.resolve(fsPromise.lstat(entryAbsolutePath)).then(function (lstatEntry) {
        var isSymlink = lstatEntry.isSymbolicLink();
        var statPromise;
        if (options.skipSymlinks && isSymlink) {
            statPromise = bluebird_1.default.resolve(undefined);
        }
        else {
            statPromise = statAsync(entryAbsolutePath);
        }
        return statPromise.then(function (statEntry) {
            return {
                name: entryName,
                absolutePath: entryAbsolutePath,
                path: entryPath,
                stat: statEntry,
                lstat: lstatEntry,
                symlink: isSymlink
            };
        });
    });
}
function doStats(entry1, entry2, same, statistics, options, level, relativePath, diffSet, type1, type2) {
    if (!options.noDiffSet) {
        options.resultBuilder(entry1, entry2, same ? "equal" : "distinct", level, relativePath, options, statistics, diffSet);
    }
    same ? statistics.equal++ : statistics.distinct++;
    if (type1 === "file") {
        same ? statistics.equalFiles++ : statistics.distinctFiles++;
    }
    else {
        same ? statistics.equalDirs++ : statistics.distinctDirs++;
    }
}
//# sourceMappingURL=compareAsync.js.map
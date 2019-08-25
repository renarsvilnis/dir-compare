"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var minimatch_1 = __importDefault(require("minimatch"));
// Insted of shallow copy
// https://stackoverflow.com/a/10916838/1378261
// import v8 from "v8";
// const structuredClone = (obj: any) => {
//   return v8.deserialize(v8.serialize(obj));
// };
function detectLoop(entry, symlinkCacheGroup) {
    if (entry && entry.symlink) {
        var realPath = fs.realpathSync(entry.absolutePath);
        if (symlinkCacheGroup[realPath]) {
            return true;
        }
    }
    return false;
}
exports.detectLoop = detectLoop;
function cloneSymlinkCache(symlinkCache) {
    return {
        dir1: shallowClone(symlinkCache.dir1),
        dir2: shallowClone(symlinkCache.dir2)
    };
}
exports.cloneSymlinkCache = cloneSymlinkCache;
function symlinkCacheFactory() {
    return {
        dir1: {},
        dir2: {}
    };
}
exports.symlinkCacheFactory = symlinkCacheFactory;
function statisticsFactory() {
    return {
        distinct: 0,
        equal: 0,
        left: 0,
        right: 0,
        distinctFiles: 0,
        equalFiles: 0,
        leftFiles: 0,
        rightFiles: 0,
        distinctDirs: 0,
        equalDirs: 0,
        leftDirs: 0,
        rightDirs: 0,
        same: undefined
    };
}
exports.statisticsFactory = statisticsFactory;
// TODO: Maybe use different method of doing it, see if it requires copying
// methods aswell as propterties - https://thecodebarbarian.com/object-assign-vs-object-spread.html
function shallowClone(obj) {
    var cloned = {};
    Object.keys(obj).forEach(function (key) {
        cloned[key] = obj[key];
    });
    return cloned;
}
exports.shallowClone = shallowClone;
function entryFactory(absolutePath, path, name) {
    var statEntry = fs.statSync(absolutePath);
    var lstatEntry = fs.lstatSync(absolutePath);
    var isSymlink = lstatEntry.isSymbolicLink();
    return {
        name: name,
        absolutePath: absolutePath,
        path: path,
        stat: statEntry,
        lstat: lstatEntry,
        symlink: isSymlink
    };
}
exports.entryFactory = entryFactory;
/**
 * One of 'missing','file','directory'
 */
function getType(fileStat) {
    if (fileStat) {
        if (fileStat.isDirectory()) {
            return "directory";
        }
        else {
            return "file";
        }
    }
    else {
        return "missing";
    }
}
exports.getType = getType;
/**
 * Matches fileName with pattern.
 */
function match(fileName, pattern) {
    var patternArray = pattern.split(",");
    for (var i = 0; i < patternArray.length; i++) {
        var pat = patternArray[i];
        if (minimatch_1.default(fileName, pat, { dot: true })) {
            //nocase
            return true;
        }
    }
    return false;
}
exports.match = match;
/**
 * Filter entries by file name. Returns true if the file is to be processed.
 */
function filterEntry(entry, options) {
    if (entry.symlink && options.skipSymlinks) {
        return false;
    }
    if (entry.stat.isFile() && options.includeFilter && !match(entry.name, options.includeFilter)) {
        return false;
    }
    if (options.excludeFilter && match(entry.name, options.excludeFilter)) {
        return false;
    }
    return true;
}
exports.filterEntry = filterEntry;
/**
 * Comparator for directory entries sorting.
 */
function compareEntryCaseSensitive(a, b) {
    if (a.stat.isDirectory() && b.stat.isFile()) {
        return -1;
    }
    else if (a.stat.isFile() && b.stat.isDirectory()) {
        return 1;
    }
    else {
        // http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
        var str1 = a.name, str2 = b.name;
        return str1 == str2 ? 0 : str1 > str2 ? 1 : -1;
    }
}
exports.compareEntryCaseSensitive = compareEntryCaseSensitive;
/**
 * Comparator for directory entries sorting.
 */
function compareEntryIgnoreCase(a, b) {
    if (a.stat.isDirectory() && b.stat.isFile()) {
        return -1;
    }
    else if (a.stat.isFile() && b.stat.isDirectory()) {
        return 1;
    }
    else {
        // http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
        var str1 = a.name.toLowerCase(), str2 = b.name.toLowerCase();
        return str1 == str2 ? 0 : str1 > str2 ? 1 : -1;
    }
}
exports.compareEntryIgnoreCase = compareEntryIgnoreCase;
/**
 * Compares two dates and returns true/false depending on tolerance (milliseconds).
 * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
 */
function sameDate(date1, date2, tolerance) {
    return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false;
}
exports.sameDate = sameDate;
/**
 * Tests if the input prepresents an numbering like input, e.g. "52.42"
 */
function isNumericLike(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.isNumericLike = isNumericLike;
//# sourceMappingURL=utils.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var pathUtils = __importStar(require("path"));
var fs = __importStar(require("fs"));
var util_1 = require("util");
var compareAsync_1 = __importDefault(require("./compareAsync"));
var defaultResultBuilderCallback_1 = __importDefault(require("./defaultResultBuilderCallback"));
var defaultFileCompare = __importStar(require("./file_compare_handlers/defaultFileCompare"));
var lineBasedFileCompare = __importStar(require("./file_compare_handlers/lineBasedFileCompare"));
var utils_1 = require("./utils");
var realPathAsync = util_1.promisify(fs.realpath);
var DefaultOptions = {
    compareSize: false,
    compareDate: false,
    dateTolerance: 1000,
    compareContent: false,
    skipSubdirs: false,
    skipSymlinks: false,
    ignoreCase: false,
    noDiffSet: false,
    // includeFilter:
    // excludeFilter
    compareFile: defaultFileCompare,
    resultBuilder: defaultResultBuilderCallback_1.default
};
function compareAsync(path1, path2, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, realPath1, realPath2, absolutePath1, absolutePath2, statistics, asyncDiffSet, symlinkCache;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([realPathAsync(path1), realPathAsync(path2)])];
                case 1:
                    _a = _b.sent(), realPath1 = _a[0], realPath2 = _a[1];
                    absolutePath1 = pathUtils.normalize(pathUtils.resolve(realPath1));
                    absolutePath2 = pathUtils.normalize(pathUtils.resolve(realPath2));
                    statistics = utils_1.statisticsFactory();
                    options = prepareOptions(options);
                    asyncDiffSet = undefined;
                    if (!options.noDiffSet) {
                        asyncDiffSet = [];
                    }
                    symlinkCache = utils_1.symlinkCacheFactory();
                    return [4 /*yield*/, compareAsync_1.default(utils_1.entryFactory(absolutePath1, path1, pathUtils.basename(path1)), utils_1.entryFactory(absolutePath2, path2, pathUtils.basename(path2)), 0, "", options, statistics, asyncDiffSet, symlinkCache)];
                case 2:
                    _b.sent();
                    completeStatistics(statistics);
                    if (!options.noDiffSet) {
                        statistics.diffSet = rebuildAsyncDiffSet(asyncDiffSet);
                    }
                    return [2 /*return*/, statistics];
            }
        });
    });
}
exports.compareAsync = compareAsync;
function prepareOptions(options) {
    options = options || {};
    // TODO: should it just use the util.clone? See that it doesnt copy methods!
    var clone = JSON.parse(JSON.stringify(options));
    clone.compareFile = options.compareFile || defaultFileCompare;
    clone.resultBuilder = options.resultBuilder || defaultResultBuilderCallback_1.default;
    clone.dateTolerance = clone.dateTolerance ? Number(clone.dateTolerance) : 1000;
    if (utils_1.isNumericLike(clone.dateTolerance)) {
        throw new Error("Date tolerance is not a number");
    }
    return clone;
}
function completeStatistics(statistics) {
    statistics.differences = statistics.distinct + statistics.left + statistics.right;
    statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles;
    statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs;
    statistics.total = statistics.equal + statistics.differences;
    statistics.totalFiles = statistics.equalFiles + statistics.differencesFiles;
    statistics.totalDirs = statistics.equalDirs + statistics.differencesDirs;
    statistics.same = statistics.differences ? false : true;
}
// Async diffsets are kept into recursive structures.
// This method transforms them into one dimensional arrays.
function rebuildAsyncDiffSet(asyncDiffSet) {
    return [asyncDiffSet].flat(Infinity);
    //   asyncDiffSet.forEach(rawDiff => {
    //     if (!Array.isArray(rawDiff)) {
    //       diffSet.push(rawDiff);
    //     } else {
    //       rebuildAsyncDiffSet(statistics, rawDiff, diffSet);
    //     }
    //   });
}
exports.fileCompareHandlers = {
    defaultFileCompare: defaultFileCompare,
    lineBasedFileCompare: lineBasedFileCompare
};
//# sourceMappingURL=index.js.map
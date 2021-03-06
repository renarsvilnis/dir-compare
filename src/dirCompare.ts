import * as pathUtils from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

import compareAsync from './compareAsync';
// import defaultFileCompare from "./fileCompareHandlers/defaultFileCompare";
import { entryRootFactory, symlinkCacheFactory /*isNumericLike*/ } from './utils';
import Statistics from './utils/Statistics';

const realpathAsync = promisify(fs.realpath);

import { SearchOptions, Difference, Results } from './types';

export default async function dirCompare(path1: string, path2: string, options: SearchOptions): Promise<Results> {
    if (!pathUtils.isAbsolute(path1)) {
        throw new Error('path1 must be an absolute path');
    }

    if (!pathUtils.isAbsolute(path2)) {
        throw new Error('path2 must be an absolute path');
    }

    const [realPath1, realPath2] = await Promise.all([realpathAsync(path1), realpathAsync(path2)]);

    // realpath() is necessary for loop detection to work properly
    const absolutePath1 = pathUtils.normalize(pathUtils.resolve(realPath1));
    const absolutePath2 = pathUtils.normalize(pathUtils.resolve(realPath2));

    // TODO: make optional?
    const statistics = new Statistics();
    // // TODO: improve prepareOptions
    // options = prepareOptions(options);

    const differences: Difference[] = [];

    const symlinkCache = symlinkCacheFactory();

    const onDifference = (difference: Difference) => {
        statistics.addDifference(difference);
        differences.push(difference);
    };

    // TODO: verify if the async entryRootFactory method works as expected after tests
    const [rootEntry1, rootEntry2] = await Promise.all([
        entryRootFactory(absolutePath1, path1, pathUtils.basename(path1)),
        entryRootFactory(absolutePath2, path2, pathUtils.basename(path2)),
    ]);

    // TODO: implement progress, need to figure out how to get totalCount before
    // and also take care of options
    await compareAsync({
        // rootEntry1: entryRootFactory(absolutePath1, path1, pathUtils.basename(path1)),
        // rootEntry2: entryRootFactory(absolutePath2, path2, pathUtils.basename(path2)),
        rootEntry1,
        rootEntry2,
        level: 0,
        relativePath: '',
        searchOptions: options,
        symlinkCache,
        onDifference,
    });

    return { statistics: statistics.toObject(), differences };
}

// TODO: improve
// function prepareOptions(options: SearchOptions): SearchOptions {
//   options = options || {};

//   // TODO: should it just use the util.clone? See that it doesn't copy methods!
//   const clone = JSON.parse(JSON.stringify(options));
//   clone.compareFile = options.compareFile || defaultFileCompare;
//   clone.dateTolerance = clone.dateTolerance ? Number(clone.dateTolerance) : 1000;

//   if (isNumericLike(clone.dateTolerance)) {
//     throw new Error("Date tolerance is not a number");
//   }
//   return clone;
// }

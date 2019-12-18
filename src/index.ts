import dirCompare from './dirCompare';
import defaultFileCompare from './fileCompareHandlers/defaultFileCompare';
import lineBasedFileCompare from './fileCompareHandlers/lineBasedFileCompare';
import { SearchOptions } from './types';

export * from './types';

export default dirCompare;

export const fileCompareHandlers = {
    defaultFileCompare,
    lineBasedFileCompare,
};

export const DEFAULT_OPTIONS: SearchOptions = {
    compareSize: false,
    compareDate: false,
    dateTolerance: 1000,
    compareContent: false,
    skipSubdirectories: false,

    /**
     * Ignore symbolic links. Defaults to 'false'.
     */
    skipSymlinks: false,

    /**
     * Ignores case when comparing names. Defaults to 'false'.
     */
    ignoreCase: false,

    /**
     * File name filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
     */
    includeFilter: undefined,

    /**
     * File/directory name exclude filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
     */
    excludeFilter: undefined,

    /**
     * File comparison handler.
     */
    compareFile: fileCompareHandlers.defaultFileCompare,

    // Only used for lineBasedFileCompare
    // TODO: figure out the default values for ignoreLineEnding,ignoreWhiteSpaces
    // TODO: separate specific file compare options from general
    ignoreLineEnding: false,
    ignoreWhiteSpaces: false,
};

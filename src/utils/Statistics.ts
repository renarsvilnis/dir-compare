import { StatisticResults, Difference } from "../types";

export default class Statistics {
  private statistics: StatisticResults = {
    total: 0,
    distinct: 0,
    equal: 0,
    left: 0,
    right: 0,

    totalFiles: 0,
    distinctFiles: 0,
    equalFiles: 0,
    leftFiles: 0,
    rightFiles: 0,

    totalDirs: 0,
    distinctDirs: 0,
    equalDirs: 0,
    leftDirs: 0,
    rightDirs: 0,

    same: true,

    // TODO: add different statistics
    differences: 0,
    differencesFiles: 0,
    differencesDirs: 0
  };

  addDifference(difference: Difference): void {
    // TODO: implement statistics
    //   same ? statistics.equal++ : statistics.distinct++;
    //   if (type1 === "file") {
    //     same ? statistics.equalFiles++ : statistics.distinctFiles++;
    //   } else {
    //     same ? statistics.equalDirs++ : statistics.distinctDirs++;
    //   }
    // statistics.differences = statistics.distinct + statistics.left + statistics.right;
    // statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles;
    // statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs;
    // statistics.total = statistics.equal + statistics.differences;
    // statistics.totalFiles = statistics.equalFiles + statistics.differencesFiles;
    // statistics.totalDirs = statistics.equalDirs + statistics.differencesDirs;
    // statistics.same = statistics.differences ? false : true;
  }

  toObject(): StatisticResults {
    return this.statistics;
  }
}

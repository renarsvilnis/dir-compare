import { StatisticResults, Difference } from "../types";

export default class Statistics {
  private statistics: StatisticResults = {
    total: 0,
    totalFiles: 0,
    totalDirs: 0,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 0,
    differencesFiles: 0,
    differencesDirs: 0,

    distinct: 0,
    distinctFiles: 0,
    distinctDirs: 0,

    left: 0,
    leftFiles: 0,
    leftDirs: 0,

    right: 0,
    rightFiles: 0,
    rightDirs: 0,

    // True until proven different
    isSame: true
  };

  addDifference(difference: Difference): void {
    this.statistics.total++;

    switch (difference.state) {
      case "equal": {
        this.statistics.equal++;

        if (difference.type1 === "file") {
          this.statistics.totalFiles++;
          this.statistics.equalFiles++;
        } else {
          this.statistics.totalDirs++;
          this.statistics.equalDirs++;
        }

        break;
      }
      case "distinct": {
        this.statistics.differences++;
        this.statistics.distinct++;

        if (difference.type1 === "file") {
          this.statistics.totalFiles++;
          this.statistics.differencesFiles++;
          this.statistics.distinctFiles++;
        } else {
          this.statistics.totalDirs++;
          this.statistics.differencesDirs++;
          this.statistics.distinctDirs++;
        }

        this.statistics.isSame = false;
        break;
      }
      case "left": {
        this.statistics.differences++;
        this.statistics.left++;

        if (difference.type1 === "file") {
          this.statistics.totalFiles++;
          this.statistics.differencesFiles++;
          this.statistics.leftFiles++;
        } else {
          this.statistics.totalDirs++;
          this.statistics.differencesDirs++;
          this.statistics.leftDirs++;
        }

        this.statistics.isSame = false;
        break;
      }
      case "right": {
        this.statistics.differences++;
        this.statistics.right++;

        if (difference.type2 === "file") {
          this.statistics.totalFiles++;
          this.statistics.differencesFiles++;
          this.statistics.rightFiles++;
        } else {
          this.statistics.totalDirs++;
          this.statistics.differencesDirs++;
          this.statistics.rightDirs++;
        }

        this.statistics.isSame = false;
        break;
      }
    }
  }

  toObject(): StatisticResults {
    return this.statistics;
  }
}

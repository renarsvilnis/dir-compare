import Statistics from "./Statistics";

test("No differences", () => {
  const statistics = new Statistics();

  expect(statistics.toObject()).toEqual({
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

    isSame: true
  });
});

test("Add Equal file difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: "file-1.txt",
    name2: "file-2.txt",
    state: "equal",
    type1: "file",
    type2: "file",
    size1: 666,
    size2: 666,
    date1: 0,
    date2: 0,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 1,
    totalDirs: 0,

    equal: 1,
    equalFiles: 1,
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

    isSame: true
  });
});

test("Add Equal directory difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: "directory-1",
    name2: "directory-2",
    state: "equal",
    type1: "directory",
    type2: "directory",
    size1: 666,
    size2: 666,
    date1: 0,
    date2: 0,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 0,
    totalDirs: 1,

    equal: 1,
    equalFiles: 0,
    equalDirs: 1,

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

    isSame: true
  });
});

test("Add Distinct file difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: "file-1",
    name2: "file-2",
    state: "distinct",
    type1: "file",
    type2: "file",
    size1: 666,
    size2: 666,
    date1: 0,
    date2: 1,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 1,
    totalDirs: 0,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 1,
    differencesDirs: 0,

    distinct: 1,
    distinctFiles: 1,
    distinctDirs: 0,

    left: 0,
    leftFiles: 0,
    leftDirs: 0,

    right: 0,
    rightFiles: 0,
    rightDirs: 0,

    isSame: false
  });
});

test("Add Distinct directory difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: "directory-1",
    name2: "directory-2",
    state: "distinct",
    type1: "directory",
    type2: "directory",
    size1: 666,
    size2: 650,
    date1: 0,
    date2: 1,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 0,
    totalDirs: 1,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 0,
    differencesDirs: 1,

    distinct: 1,
    distinctFiles: 0,
    distinctDirs: 1,

    left: 0,
    leftFiles: 0,
    leftDirs: 0,

    right: 0,
    rightFiles: 0,
    rightDirs: 0,

    isSame: false
  });
});

test("Add Left file difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: undefined,
    relativePath: "what-is-this",
    name1: "file-1",
    name2: undefined,
    state: "left",
    type1: "file",
    type2: "missing",
    size1: 666,
    size2: undefined,
    date1: 0,
    date2: undefined,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 1,
    totalDirs: 0,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 1,
    differencesDirs: 0,

    distinct: 0,
    distinctFiles: 0,
    distinctDirs: 0,

    left: 1,
    leftFiles: 1,
    leftDirs: 0,

    right: 0,
    rightFiles: 0,
    rightDirs: 0,

    isSame: false
  });
});

test("Add Left directory difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: "/fake/path-1",
    path2: undefined,
    relativePath: "what-is-this",
    name1: "directory-1",
    name2: undefined,
    state: "left",
    type1: "directory",
    type2: "missing",
    size1: 666,
    size2: undefined,
    date1: 0,
    date2: undefined,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 0,
    totalDirs: 1,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 0,
    differencesDirs: 1,

    distinct: 0,
    distinctFiles: 0,
    distinctDirs: 0,

    left: 1,
    leftFiles: 0,
    leftDirs: 1,

    right: 0,
    rightFiles: 0,
    rightDirs: 0,

    isSame: false
  });
});

test("Add Right file difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: undefined,
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: undefined,
    name2: "file-2",
    state: "right",
    type1: "missing",
    type2: "file",
    size1: undefined,
    size2: 666,
    date1: undefined,
    date2: 1,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 1,
    totalDirs: 0,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 1,
    differencesDirs: 0,

    distinct: 0,
    distinctFiles: 0,
    distinctDirs: 0,

    left: 0,
    leftFiles: 0,
    leftDirs: 0,

    right: 1,
    rightFiles: 1,
    rightDirs: 0,

    isSame: false
  });
});

test("Add Right directory difference", () => {
  const statistics = new Statistics();

  statistics.addDifference({
    path1: undefined,
    path2: "/fake/path-2",
    relativePath: "what-is-this",
    name1: undefined,
    name2: "directory-2",
    state: "right",
    type1: "missing",
    type2: "directory",
    size1: undefined,
    size2: 650,
    date1: undefined,
    date2: 1,
    level: 0
  });

  expect(statistics.toObject()).toEqual({
    total: 1,
    totalFiles: 0,
    totalDirs: 1,

    equal: 0,
    equalFiles: 0,
    equalDirs: 0,

    differences: 1,
    differencesFiles: 0,
    differencesDirs: 1,

    distinct: 0,
    distinctFiles: 0,
    distinctDirs: 0,

    left: 0,
    leftFiles: 0,
    leftDirs: 0,

    right: 1,
    rightFiles: 0,
    rightDirs: 1,

    isSame: false
  });
});

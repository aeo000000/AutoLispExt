import * as chai from "chai";
import * as fs from "fs";
import * as path from "path";
import { beforeEach } from "mocha";
import { LispFormatter } from "../../format/formatter";
import { ReadonlyDocument } from "../../project/readOnlyDocument";
import * as fmtConfig from "../../format/fmtconfig";
import { ImportMock } from "ts-mock-imports";
import * as resources from "../../resources";

let assert = chai.assert;
let testDir = path.join(__dirname + "/../../../extension/src/test");
const outputDir = path.join(testDir + "/OutputFile");

fs.mkdir(outputDir, { recursive: true }, (err) => {
  if (err) {
    return console.error(err);
  }
});

function getFileName(i: number) {
  const source = path.join(testDir + "/SourceFile/unFormatted" + i + ".lsp");
  const output = path.join(
    testDir + "/OutputFile/formatedOutputFile" + i + ".lsp"
  );
  const baseline = path.join(
    testDir + "/Baseline/formatedBasefile" + i + ".lsp"
  );
  return [source, output, baseline];
}
function comparefileSync(
  i: number,
  output: string,
  fmt: string,
  baseline: string
) {
  try {
    fs.writeFileSync(output, fmt);
    let baseString = fs.readFileSync(baseline, { encoding: "utf8", flag: "r" });
    //Trick to pass the test is to ignore the \r
    fmt = fmt.replace(/(\r)/gm, "");
    baseString = baseString.replace(/(\r)/gm, "");
    assert.isTrue(fmt === baseString);
  } catch (err) {
    assert.fail(`Format Test Case ${i} failed!`);
  }
}
// Notes:
// Format test is a setting sensitive which depends on the format settings defined
// in the fmtconfig.ts
// The baseline is generated by the above default value:
// MaxLineChars: 85
// NarrowStyleIndent: 2
// CloseParenthesisStyle: 'New line with outer indentation'
// LongListFormatStyle: 'Fill to margin'
// Need to remove the \r to do the format output compare
suite("Lisp Formatter mock Tests", function () {
  let closeParenStyleStub;
  let maximumLineCharsStub;
  let longListFormatStyleStub;
  let indentSpacesStub;
  let internalLispFuncsStub;
  let internalOperators;

  setup(() => {
    let keyFile = path.join(
      __dirname + "/../../../extension/data/alllispkeys.txt"
    );
    internalOperators = fs.readFileSync(keyFile).toString().split("\r\n");
    internalLispFuncsStub = ImportMock.mockOther(
      resources,
      "internalLispFuncs",
      internalOperators
    );
  });
  beforeEach(async () => {
    closeParenStyleStub.restore();
    maximumLineCharsStub.restore();
    longListFormatStyleStub.restore();
    indentSpacesStub.restore();
  });
  teardown(() => {
    internalLispFuncsStub.restore();
  });

  suiteTeardown(async () => {
    closeParenStyleStub.restore();
    maximumLineCharsStub.restore();
    longListFormatStyleStub.restore();
    indentSpacesStub.restore();
  });
  suiteSetup(async () => {
    closeParenStyleStub = ImportMock.mockFunction(
      fmtConfig,
      "closeParenStyle",
      "New line with outer indentation"
    );
    maximumLineCharsStub = ImportMock.mockFunction(
      fmtConfig,
      "maximumLineChars",
      85
    );
    longListFormatStyleStub = ImportMock.mockFunction(
      fmtConfig,
      "longListFormatStyle",
      "Fill to margin"
    );
    indentSpacesStub = ImportMock.mockFunction(fmtConfig, "indentSpaces", 2);
  });

  test("Lisp Formatter Test case 1", function () {
    //Basic test case
    let i = 1;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 2", function () {
    // Test setq in new lines
    let i = 2;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 3", function () {
    // Test multiple functions format
    let i = 3;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 4", function () {
    // The empty line should not be removed after format
    let i = 4;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 5", async function () {
    // Test the Max line chars setting
    // Test the bug that it will be a space between the last two brackets ) )
    // MaxLineChars: 65
    let i = 5;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      await setMaxLineChars(65);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 6", function () {
    // Test the indent, the default indent should be 2
    let i = 6;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 7", async function () {
    // Test the single column setting
    let i = 7;
    try {
      const [source, output, baseline] = getFileName(i);
      const doc = ReadonlyDocument.open(source);
      // set as wide single column format
      // await setLongListFormat('Single Column');
      await setLongListFormat("Single Column");
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 8", async function () {
    // Test another single column setting
    let i = 8;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      // set as wide single column format
      // await setLongListFormat('Single Column');
      await setLongListFormat("Single Column");
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 9", function () {
    // Test list format which comes from an old bug
    // This is a bug needs to be fixed in lisp extension
    let i = 9;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 10", function () {
    // Test long list and big file - chinaMap.lsp
    // This test will take long time
    let i = 10;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 11", async function () {
    // Test indent space setting
    let i = 11;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setIndentSpaces(4);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 12", async function () {
    // Test Closed Parenthesis In Same Line setting
    let i = 12;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setClosedParenInSameLine("same line");
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 13", async function () {
    // Test Mixed settings
    // MaxLineChars: 65
    // NarrowStyleIndent: 4
    // CloseParenthesisStyle: 'Same line'
    // LongListFormatStyle: 'Single line'
    let i = 13;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setClosedParenInSameLine("same line");
      await setIndentSpaces(4);
      await setMaxLineChars(65);
      await setLongListFormat("single column");
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 14", async function () {
    // Test the comments after the brackets ") ;progn"
    // MaxLineChars: 80
    // NarrowStyleIndent: 4
    let i = 14;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setIndentSpaces(4);
      await setMaxLineChars(80);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 15", async function () {
    // Test unicode
    // MaxLineChars: 60
    // NarrowStyleIndent: 2
    let i = 15;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setIndentSpaces(2);
      await setMaxLineChars(60);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  test("Lisp Formatter Test case 16", async function () {
    // Test invalid setting
    // MaxLineChars: 30
    // NarrowStyleIndent: 8
    let i = 16;
    try {
      const [source, output, baseline] = getFileName(i);
      let doc = ReadonlyDocument.open(source);
      await setIndentSpaces(8);
      await setMaxLineChars(30);
      let fmt = LispFormatter.format(doc, null);
      comparefileSync(i, output, fmt, baseline);
    } catch (err) {
      assert.fail(`The lisp format test case ${i} failed`);
    }
  });

  async function setIndentSpaces(indent: number) {
    if (indentSpacesStub) {
      indentSpacesStub.restore();
    }
    indentSpacesStub = ImportMock.mockFunction(
      fmtConfig,
      "indentSpaces",
      indent
    );
  }
  async function setClosedParenInSameLine(closeParenStyle: string) {
    if (closeParenStyleStub) {
      closeParenStyleStub.restore();
    }
    closeParenStyleStub = ImportMock.mockFunction(
      fmtConfig,
      "closeParenStyle",
      closeParenStyle
    );
  }
  async function setMaxLineChars(maxchar: number) {
    if (maximumLineCharsStub) {
      maximumLineCharsStub.restore();
    }
    maximumLineCharsStub = ImportMock.mockFunction(
      fmtConfig,
      "maximumLineChars",
      maxchar
    );
  }
  async function setLongListFormat(LongListFormat: string) {
    if (longListFormatStyleStub) {
      longListFormatStyleStub.restore();
    }
    longListFormatStyleStub = ImportMock.mockFunction(
      fmtConfig,
      "longListFormatStyle",
      LongListFormat
    );
  }
});
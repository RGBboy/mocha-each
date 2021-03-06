import { vsprintf } from 'sprintf-js';

module.exports = forEach;

/**
 * Defines Mocha test cases for each given parameter.
 * @param {Array} parameters
 * @param {function} defaultIt - The 'it' function used in this function.
 *     If omitted, 'it' in global name space is used.
 * @return {Object} The object which has a method to define test cases.
 */
function forEach(parameters, defaultIt = global.it) {
  const it = makeTestCaseDefiner(parameters, defaultIt);
  it.skip = makeParameterizedSkip(parameters, defaultIt);
  it.only = makeParameterizedOnly(parameters, defaultIt);
  return { it };
}

/**
 * Create a function which define parameterized tests
 * to be ignored.
 * @private
 */
function makeParameterizedSkip(parameters, defaultIt) {
  return makeTestCaseDefiner(
    parameters,
    defaultIt ? defaultIt.skip : undefined
  );
}

/**
 * Create a function which define exclusive parameterized tests.
 * @private
 */
function makeParameterizedOnly(parameters, defaultIt) {
  return function(title, test) {
    const it = makeTestCaseDefiner(parameters, defaultIt);
    global.describe.only('', () => it(title, test));
  };
}

/**
 * Create a function which defines test cases for
 * each given parameter.
 * @private
 */
function makeTestCaseDefiner(parameters, it) {
  return function defineTestCases(title, test) {
    const makeTitle = (typeof title === 'function')
      ? title
      : (...args) => vsprintf(title, args);

    const arrayParams = parameters.map(param => {
      return Array.isArray(param) ? param : [param];
    });

    const isAsync = isAsyncTest(arrayParams, test);
    arrayParams.forEach((param, index) => {
      it(
        makeTitle(...[...param, index]),
        makeTestBody(param, test, isAsync)
      );
    });
  };
}

/**
 * Wrap a given test function and convert it to
 * a function passed to the `it`.
 * @private
 */
function makeTestBody(param, test, isAsync) {
  if (isAsync) {
    return function(done) {
      test.apply(this, param.concat(done));
    };
  }
  return function() {
    test.apply(this, param);
  };
}

/**
 * Return true if the testBody seems to be async.
 * @private
 */
function isAsyncTest(parameters, test) {
  const nLongestParam = parameters.reduce((n, param) => {
    return Math.max(n, param.length);
  }, 0);
  return nLongestParam < test.length;
}

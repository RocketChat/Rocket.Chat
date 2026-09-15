'use strict';

const base = require('./stryker.conf.js');

/**
 * Mutation testing with a type check in front of it.
 *
 * Stryker mutates syntax and never asks the compiler, so it produces mutants that could not ship: a `boolean`
 * where a `Date` belongs, an argument dropped from a call. This config type-checks every mutant first and
 * reports the ones that do not build as `CompileError` rather than `Survived`, which shortens the list of
 * survivors to read.
 *
 * Read what it removes before trusting the shorter list. A guard is often what narrows a type, so removing it
 * stops the code below from compiling — and a real gap then leaves the report as a `CompileError` rather than a
 * survivor. On this target it is close to even: three noise mutants gone, three findings lost, and the rest
 * still reported as `NoCoverage` on the guarded body.
 *
 * It also costs about 11 minutes against the 2 seconds of `stryker.conf.js`, so it is a deliberate pass rather
 * than the loop to iterate in. Run it before you trust a score, not while you are writing a test.
 *
 * `# errors` equal to the total mutant count means a project-wide diagnostic reached every mutant. The run
 * exits 0 and reports a score of `n/a`. That is an empty report, not an untestable file.
 */
module.exports = {
	...base,

	checkers: ['typescript'],
	tsconfigFile: 'tsconfig.json',

	htmlReporter: { fileName: 'reports/mutation-typed/index.html' },
	jsonReporter: { fileName: 'reports/mutation-typed/mutation.json' },

	/**
	 * Reuse the results of the last run for code that has not changed.
	 *
	 * This skips the per-mutant work, which is where the run spends its time — measured at 627s down to 124s
	 * for an unchanged file. It does not skip the project compile, so about 85 seconds is the floor of any
	 * typed run whatever the cache holds.
	 *
	 * Pass `--force` to rebuild the file when you doubt it. A run that fails writes no file at all, so check
	 * the log for `No incremental result file found` before you credit a fast run to the cache.
	 */
	incremental: true,
	incrementalFile: 'reports/mutation-typed/stryker-incremental.json',
};

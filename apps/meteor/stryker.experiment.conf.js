'use strict';

/**
 * Mutation testing configuration for the scoping experiment.
 *
 * `stryker.conf.js` grades one hand-picked target and names the members by hand. This config takes the
 * (spec, source) pair from the environment and mutates the whole source file, so a driver can walk the
 * frame. The outcome is read over covered mutants only, so the `NoCoverage` a whole-file `mutate` adds
 * does not enter the score.
 *
 * See docs/proposals/mutation-testing-scope-experiment.md.
 */

const specs = process.env.EXP_SPECS.split(',');
const source = process.env.EXP_SOURCE;
const reportDir = process.env.EXP_REPORT_DIR;

module.exports = {
	packageManager: 'yarn',
	testRunner: 'mocha',

	mochaOptions: {
		config: './.mocharc.base.json',
		spec: specs,
	},

	mutate: [source],
	coverageAnalysis: 'perTest',

	// `.stryker-tmp*` matters here: the driver runs several targets at once, each with its own temp
	// directory, and a sandbox copy that walks a sibling run's directory fails as that run deletes it.
	ignorePatterns: ['.meteor', 'client', 'public', 'private', 'tests/e2e', '.storybook', 'packages', 'reports', '.stryker-tmp*'],

	reporters: ['json'],
	jsonReporter: { fileName: `${reportDir}/mutation.json` },

	thresholds: { high: 80, low: 60, break: null },

	concurrency: Number(process.env.EXP_CONCURRENCY || 4),
	timeoutMS: 30000,
	tempDirName: process.env.EXP_TMP || '.stryker-tmp',
	cleanTempDir: true,
};

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Mutation testing configuration.
 *
 * Coverage says a line ran. It does not say a test would notice the line change. Stryker edits the source —
 * one small change at a time — and reruns the suite. A change no test rejects is a "survived mutant", and it
 * names a line the suite executes but does not check.
 *
 * The run is scoped on purpose. `service.ts` is 2200 lines and one spec covers one join path through it, so
 * `mutate` names the members that path runs through. Point `SPEC` and `MEMBERS` at a different spec to grade
 * that spec; the rest of the config does not change.
 */

const SERVICE = 'server/services/video-conference/service.ts';

const SPEC = 'server/services/video-conference/addUserToCall.spec.ts';

/**
 * The code under test: the join path that the spec drives, and the helpers it owns.
 *
 * `leaveOtherCalls` and `claimBusyForCall` are left out on purpose. The spec asserts that a join calls them,
 * which is the spec's business; what they do inside belongs to `leaveCall.spec.ts` and `busyStatus.spec.ts`,
 * and mutating them here only reports their gaps against the wrong spec.
 */
const MEMBERS = [
	'addUser',
	'isEmbeddedProvider',
	'addUserToCall',
	'isPersistentChatEnabled',
	'getPersistentChatMode',
	'chatLivesInAThread',
	'autoFollowCallThread',
];

/**
 * Finds the line range of a class member by name.
 *
 * Stryker takes ranges as `file.ts:START-END`, and written by hand those go stale the moment the file moves —
 * one rebase is enough. A stale range does not fail: it grades whatever now sits at those numbers and reports
 * a score for it. So the range is read from the file, and a name that no longer resolves throws.
 *
 * The member ends at the first line that is exactly one tab and a closing brace. Every brace inside a member
 * is indented deeper, so that line is the member's own.
 */
const memberRange = (lines, name) => {
	const declaration = new RegExp(`^\\t(?:(?:public|private|protected)\\s+)?(?:async\\s+)?${name}\\(`);

	const start = lines.findIndex((line) => declaration.test(line));
	if (start === -1) {
		throw new Error(`stryker.conf.js: no member named '${name}' in ${SERVICE}. Has it been renamed or moved?`);
	}

	const end = lines.findIndex((line, index) => index > start && line === '\t}');
	if (end === -1) {
		throw new Error(`stryker.conf.js: member '${name}' in ${SERVICE} has no closing brace at member indentation.`);
	}

	return `${SERVICE}:${start + 1}-${end + 1}`;
};

const lines = fs.readFileSync(path.join(__dirname, SERVICE), 'utf8').split('\n');

module.exports = {
	packageManager: 'yarn',
	testRunner: 'mocha',

	/**
	 * The unit-test mocha config, minus its spec list.
	 *
	 * `.mocharc.base.json` carries the `tsx` require hook and the chai plugins. `.mocharc.js` adds the full
	 * spec list of the repo, which would run every unit test against every mutant.
	 */
	mochaOptions: {
		config: './.mocharc.base.json',
		spec: [SPEC],
	},

	mutate: MEMBERS.map((name) => memberRange(lines, name)),

	/**
	 * Which test covers which mutant, measured in one instrumented run up front.
	 *
	 * A mutant on a line no test reaches is then reported without a test run, and a mutant that is covered
	 * reruns only the tests that reach it.
	 */
	coverageAnalysis: 'perTest',

	/**
	 * Stryker copies the project into a sandbox before it edits anything. The specs stub their imports through
	 * `proxyquire.noCallThru()`, so the sandbox needs the server tree and little else. These directories are
	 * the bulk of the file count and none of the code under test.
	 */
	ignorePatterns: ['.meteor', 'client', 'public', 'private', 'tests/e2e', '.storybook', 'packages', 'reports'],

	reporters: ['html', 'json', 'clear-text', 'progress'],
	htmlReporter: { fileName: 'reports/mutation/index.html' },
	jsonReporter: { fileName: 'reports/mutation/mutation.json' },
	clearTextReporter: { allowColor: true, maxTestsToLog: 3 },

	// A survived mutant is a finding to read, not a build to fail. Raise `break` once a target holds a score.
	thresholds: { high: 80, low: 60, break: null },

	concurrency: 4,
	timeoutMS: 30000,
	tempDirName: '.stryker-tmp',
};

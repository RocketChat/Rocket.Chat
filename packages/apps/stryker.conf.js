'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Mutation testing configuration for the Apps-Engine package.
 *
 * Coverage says a line ran. It does not say a test would notice the line change. Stryker edits the source —
 * one small change at a time — and reruns the tests. A change no test rejects is a "survived mutant", and it
 * names a line the tests execute but do not check.
 *
 * See docs/mutation-testing.md for how to read the result.
 *
 * ## Why this config differs from apps/meteor's
 *
 * The meteor app runs mocha, so Stryker drives it through `@stryker-mutator/mocha-runner` and measures which
 * test covers which mutant. This package runs `node:test`, which has no Stryker runner, so the run goes
 * through the generic command runner. Two consequences follow:
 *
 * - `coverageAnalysis` must be `off`. Stryker cannot ask a command which test reached which line, so every
 *   mutant reruns the whole command. Keep `TEST` pointed at the target's own test file.
 * - There is no `NoCoverage` status. A mutant no test reaches is reported as `Survived`, because the command
 *   still exits 0. Read a survivor in a member the test never calls as "not tested", not as "not checked".
 *
 * ## Two test files are left out on purpose
 *
 * `DenoRuntimeSubprocessController.test.ts` and `SecureFieldsCodecCompatibility.test.ts` spawn a real Deno
 * subprocess. They take about four minutes each and they fail in a tree without the Deno cache. A red
 * baseline stops Stryker before it mutates anything, so no target may include them.
 */

const TARGET = process.env.TARGET || 'Utilities';

/**
 * The targets, each a test file and the code that test file owns.
 *
 * `members` narrows the run to named class members. Leave it out to mutate the whole file. A whole-file
 * `mutate` on a 1000-line manager reports mostly survivors that nothing reaches, which says nothing about
 * the test.
 */
const TARGETS = {
	Utilities: {
		test: 'tests/server/misc/Utilities.test.ts',
		source: 'src/server/misc/Utilities.ts',
	},
	AppImplements: {
		test: 'tests/server/compiler/AppImplements.test.ts',
		source: 'src/server/compiler/AppImplements.ts',
	},
	AppConsole: {
		test: 'tests/server/logging/AppConsole.test.ts',
		source: 'src/server/logging/AppConsole.ts',
	},
	AppSettingsManager: {
		test: 'tests/server/managers/AppSettingsManager.test.ts',
		source: 'src/server/managers/AppSettingsManager.ts',
	},
	AppApiManager: {
		test: 'tests/server/managers/AppApiManager.test.ts',
		source: 'src/server/managers/AppApiManager.ts',
	},
	UIActionButtonManager: {
		test: 'tests/server/managers/UIActionButtonManager.test.ts',
		source: 'src/server/managers/UIActionButtonManager.ts',
	},
	AppListenerManager: {
		test: 'tests/server/managers/AppListenerManager.test.ts',
		source: 'src/server/managers/AppListenerManager.ts',
		// The test constructs the manager and registers one app. It never fires a listener, so the executor
		// methods belong to nobody yet and mutating them would grade a test that does not exist.
		members: ['constructor', 'registerListeners', 'unregisterListeners', 'releaseEssentialEvents', 'lockEssentialEvents', 'getListeners'],
	},
};

const target = TARGETS[TARGET];
if (!target) {
	throw new Error(`stryker.conf.js: no target named '${TARGET}'. Try one of: ${Object.keys(TARGETS).join(', ')}.`);
}

const DENO_SUBPROCESS_TESTS = ['DenoRuntimeSubprocessController.test.ts', 'SecureFieldsCodecCompatibility.test.ts'];

/**
 * The test files that may run. The two Deno subprocess tests are excluded for the reason given above.
 */
const feasibleTests = () => {
	const found = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
			const relative = `${dir}/${entry.name}`;
			if (entry.isDirectory()) {
				walk(relative);
			} else if (entry.name.endsWith('.test.ts') && !DENO_SUBPROCESS_TESTS.some((name) => entry.name === name)) {
				found.push(relative);
			}
		}
	};
	walk('tests');
	return found.sort();
};

/**
 * Which tests run against each mutant.
 *
 * - `own` — the target's own test file. This grades that one test.
 * - `all` — every feasible test file.
 * - `all-but-own` — every feasible test file except the target's own.
 *
 * Run `all` and `all-but-own` and diff the two reports to find what the target's test catches that nothing
 * else does. A mutant killed under `all` and surviving under `all-but-own` is a unique kill, and unique kills
 * are what a test is worth. See docs/mutation-testing.md, "Is a shallow test worth keeping".
 */
const SCOPE = process.env.SCOPE || 'own';

const testFiles = (() => {
	if (SCOPE === 'own') return [target.test];
	if (SCOPE === 'all') return feasibleTests();
	if (SCOPE === 'all-but-own') return feasibleTests().filter((file) => file !== target.test);
	throw new Error(`stryker.conf.js: SCOPE must be 'own', 'all' or 'all-but-own', not '${SCOPE}'.`);
})();

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
	const declaration = new RegExp(`^\\t(?:(?:public|private|protected)\\s+)?(?:static\\s+)?(?:async\\s+)?${name}\\??\\(`);

	const start = lines.findIndex((line) => declaration.test(line));
	if (start === -1) {
		throw new Error(`stryker.conf.js: no member named '${name}' in ${target.source}. Has it been renamed or moved?`);
	}

	const end = lines.findIndex((line, index) => index > start && line === '\t}');
	if (end === -1) {
		throw new Error(`stryker.conf.js: member '${name}' in ${target.source} has no closing brace at member indentation.`);
	}

	return `${target.source}:${start + 1}-${end + 1}`;
};

const mutate = (() => {
	if (!target.members) {
		return [target.source];
	}
	const lines = fs.readFileSync(path.join(__dirname, target.source), 'utf8').split('\n');
	return target.members.map((name) => memberRange(lines, name));
})();

module.exports = {
	packageManager: 'yarn',

	testRunner: 'command',
	commandRunner: {
		command: `NODE_ENV=test node --require ts-node/register/transpile-only --test-reporter dot --test-concurrency=1 --test-timeout=60000 --test ${testFiles.join(' ')}`,
	},

	mutate,

	// The command runner cannot report which test reached which mutant, so this is the only valid setting.
	coverageAnalysis: 'off',

	// The sandbox needs the sources and the tests. These are the bulk of the file count and none of the code
	// under test; `.deno-cache` alone is tens of thousands of files.
	ignorePatterns: ['dist', 'base-runtime/dist', 'node-runtime/dist', '.deno-cache', 'deno-runtime', 'reports'],

	reporters: ['html', 'json', 'clear-text', 'progress'],
	htmlReporter: { fileName: `reports/mutation/${TARGET}.${SCOPE}.html` },
	jsonReporter: { fileName: `reports/mutation/${TARGET}.${SCOPE}.json` },
	clearTextReporter: { allowColor: true, maxTestsToLog: 3 },

	// A survived mutant is a finding to read, not a build to fail. Raise `break` once a target holds a score.
	thresholds: { high: 80, low: 60, break: null },

	concurrency: 4,
	timeoutMS: 60000,
	tempDirName: '.stryker-tmp',
};

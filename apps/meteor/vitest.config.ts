import { configDefaults, defineConfig } from 'vitest/config';

// Backend unit test configuration. Replaces the Mocha setups previously defined in
// `.mocharc.js` (unit) and `.mocharc.definition.js` (type-guard definition tests).
// chai + sinon are kept as-is; only the runner changes. See `tests/setup/vitestSetup.ts`
// for chai plugin registration.
const setupFiles = ['./tests/setup/vitestSetup.ts'];

// Many specs use bare global `describe`/`it` (no import), as they did under Mocha, so globals
// are enabled. Specs that previously imported from 'mocha' are codemodded to import from
// 'vitest' and work alongside the globals. NOTE: `globals`/`exclude` are not inherited from the
// root `test` config by projects — they must be set on each project.
const globals = true;

// Keep Vitest's default excludes (node_modules, dist, …) and add committed-empty placeholder specs
// (abandoned stubs from old feature PRs) that Mocha silently ignored but Vitest errors on.
const exclude = [
	...configDefaults.exclude,
	'tests/unit/app/livechat/server/outbound/outbound.spec.ts',
	'tests/unit/server/services/room/hooks/FederationActions.tests.ts',
];

export default defineConfig({
	// chai + its plugins add exports at runtime (e.g. chai-spies' `spy`). Vitest's dep pre-bundling
	// snapshots only statically-detectable exports, dropping those — so exclude them from optimization
	// to preserve `import { spy } from 'chai'` and friends.
	optimizeDeps: {
		exclude: ['chai', 'chai-spies', 'chai-as-promised', 'chai-datetime', 'chai-dom'],
	},
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					environment: 'node',
					globals,
					setupFiles,
					exclude,
					include: [
						'server/lib/callbacks.spec.ts',
						'server/lib/cas/*.spec.ts',
						'server/lib/ldap/**/*.spec.ts',
						'server/lib/dataExport/**/*.spec.ts',
						'server/ufs/*.spec.ts',
						'ee/server/lib/ldap/*.spec.ts',
						'ee/tests/**/*.tests.ts',
						'ee/tests/**/*.spec.ts',
						'tests/unit/app/**/*.spec.ts',
						'tests/unit/app/**/*.tests.{js,ts}',
						'tests/unit/lib/**/*.{spec,tests}.ts',
						'server/routes/avatar/**/*.spec.ts',
						'tests/unit/server/**/*.{spec,tests}.ts',
						'app/2fa/server/**/*.spec.ts',
						'app/api/server/lib/**/*.spec.ts',
						'app/file-upload/server/**/*.spec.ts',
						'app/statistics/server/**/*.spec.ts',
						'app/livechat/server/lib/**/*.spec.ts',
						'app/push/server/**/*.spec.ts',
						'app/utils/server/**/*.spec.ts',
					],
				},
			},
			{
				test: {
					name: 'definition',
					environment: 'node',
					globals,
					setupFiles,
					include: ['tests/unit/definition/**/*.spec.ts'],
				},
			},
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
		},
	},
});

import { createRequire } from 'node:module';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Called from the selected package directory, before Stryker creates its sandbox.
// Keep Jest's version-dependent configuration loading here. When upgrading Jest or
// Stryker, run yarn test:mutation:tooling to check environments and alias resolution.
export async function loadMutationJestConfig() {
	const configFile = 'jest.config.ts';
	// Keep ts-node from compiling ESM JavaScript dependencies when loading Meteor's TypeScript config.
	process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ ...JSON.parse(process.env.TS_NODE_COMPILER_OPTIONS ?? '{}'), allowJs: false });
	// Resolve through the selected package's Jest so jest-config uses the same version.
	const requirePackage = createRequire(resolve('package.json'));
	const requireJest = createRequire(requirePackage.resolve('jest'));
	const requireJestCli = createRequire(requireJest.resolve('jest-cli'));
	const { readConfigs, readInitialOptions } = requireJestCli('jest-config');
	const { configs } = await readConfigs({ $0: 'mutation-tests', _: [], config: resolve(configFile) }, [process.cwd()]);
	const { config } = await readInitialOptions(resolve(configFile));

	// Local aliases must read mutated files in the sandbox. External aliases must retain
	// their resolved paths, e.g. <rootDir>/../../node_modules/react in UI packages.
	const sandboxMapping = (value, rootDir) => {
		if (Array.isArray(value)) {
			return value.map((entry) => sandboxMapping(entry, rootDir));
		}
		if (value === rootDir || value.startsWith(`${rootDir}${sep}`)) {
			return `<rootDir>/${relative(rootDir, value).split(sep).join('/')}`;
		}
		return value;
	};
	const aliases = (jestConfig) =>
		Object.fromEntries(jestConfig.moduleNameMapper.map(([pattern, mapping]) => [pattern, sandboxMapping(mapping, jestConfig.rootDir)]));

	if (config.projects?.length) {
		if (
			config.projects.length !== configs.length ||
			config.projects.some((project) => typeof project !== 'object' || project === null) ||
			configs.some((project) => project.rootDir !== process.cwd())
		) {
			throw new Error('Mutation testing supports inline Jest projects sharing the package root.');
		}
		return {
			configFile,
			config: {
				testEnvironment: fileURLToPath(new URL('./mutation-jest-environment.cjs', import.meta.url)),
				testEnvironmentOptions: undefined,
				projects: config.projects.map((project, index) => {
					const resolved = configs[index];
					const environment = ['node', 'jsdom'].find(
						(name) => resolved.testEnvironment === requirePackage.resolve(`jest-environment-${name}`),
					);
					if (!environment || !resolved.testRunner.includes('jest-circus')) {
						throw new Error('Mutation testing supports Jest projects using Node or jsdom with jest-circus.');
					}
					return {
						...project,
						rootDir: '<rootDir>',
						// Jest applies Stryker's root environment to every project; keep the original in project options.
						testEnvironmentOptions: { ...resolved.testEnvironmentOptions, mutationEnvironment: resolved.testEnvironment },
						moduleNameMapper: aliases(resolved),
					};
				}),
			},
		};
	}

	const [jestConfig] = configs;

	return {
		configFile,
		config: {
			// Stryker's coverage environment otherwise defaults to Node when jsdom comes from a preset.
			testEnvironment: jestConfig.testEnvironment,
			moduleNameMapper: aliases(jestConfig),
		},
	};
}

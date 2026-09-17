import { createRequire } from 'node:module';
import { relative, resolve, sep } from 'node:path';

// Called from the selected package directory, before Stryker creates its sandbox.
// Keep Jest's version-dependent configuration loading here. When upgrading Jest or
// Stryker, run yarn test:mutation:tooling to check environments and alias resolution.
export async function loadMutationJestConfig() {
	const configFile = 'jest.config.ts';
	// Resolve through the selected package's Jest so jest-config uses the same version.
	const requirePackage = createRequire(resolve('package.json'));
	const requireJest = createRequire(requirePackage.resolve('jest'));
	const requireJestCli = createRequire(requireJest.resolve('jest-cli'));
	const { readConfigs } = requireJestCli('jest-config');
	const { configs } = await readConfigs({ $0: 'mutation-tests', _: [], config: resolve(configFile) }, [process.cwd()]);

	if (configs.length !== 1) {
		throw new Error('Shared mutation testing supports one Jest project per package. Multi-project configurations need a dedicated setup.');
	}

	const [jestConfig] = configs;

	// Local aliases must read mutated files in the sandbox. External aliases must retain
	// their resolved paths, e.g. <rootDir>/../../node_modules/react in UI packages.
	const sandboxMapping = (value) => {
		if (Array.isArray(value)) {
			return value.map(sandboxMapping);
		}
		if (value === jestConfig.rootDir || value.startsWith(`${jestConfig.rootDir}${sep}`)) {
			return `<rootDir>/${relative(jestConfig.rootDir, value).split(sep).join('/')}`;
		}
		return value;
	};

	return {
		configFile,
		config: {
			// Stryker's coverage environment otherwise defaults to Node when jsdom comes from a preset.
			testEnvironment: jestConfig.testEnvironment,
			moduleNameMapper: Object.fromEntries(jestConfig.moduleNameMapper.map(([pattern, mapping]) => [pattern, sandboxMapping(mapping)])),
		},
	};
}

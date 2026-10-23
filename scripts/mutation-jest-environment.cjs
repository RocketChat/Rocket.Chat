// Stryker wraps this adapter with its coverage hooks while each project retains its environment.
module.exports = function mutationJestEnvironment(config, context) {
	const { mutationEnvironment, ...testEnvironmentOptions } = config.projectConfig.testEnvironmentOptions;
	// eslint-disable-next-line import-x/no-dynamic-require -- Use the environment resolved by the package's Jest version.
	const environment = require(mutationEnvironment);
	const Environment = environment.TestEnvironment ?? environment.default ?? environment;
	return new Environment({ ...config, projectConfig: { ...config.projectConfig, testEnvironmentOptions } }, context);
};

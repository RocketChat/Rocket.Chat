const isMeteorClientSource = (fileName) => !!fileName && fileName.includes('/apps/meteor/client/');

module.exports = (api) => {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		// The web client uses `declare` class fields, which Babel 7's TypeScript plugin rejects unless allowDeclareFields is on.
		// Scoped to apps/meteor/client: with the flag on, uninitialized fields are emitted, which would change other packages.
		overrides: [
			{
				test: (fileName) => isMeteorClientSource(fileName) && fileName.endsWith('.ts'),
				plugins: [[require('@babel/plugin-transform-typescript'), { isTSX: false, allowNamespaces: true, allowDeclareFields: true }]],
			},
			{
				test: (fileName) => isMeteorClientSource(fileName) && fileName.endsWith('.tsx'),
				plugins: [[require('@babel/plugin-transform-typescript'), { isTSX: true, allowNamespaces: true, allowDeclareFields: true }]],
			},
		],
	};
};

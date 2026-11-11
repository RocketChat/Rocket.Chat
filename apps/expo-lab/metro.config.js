const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Expo pins an exact React; the monorepo hoists a different one to the root. Force a single copy.
const singletons = ['react', 'react-dom', 'react-native', 'scheduler'];
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
	const resolve = upstream ?? context.resolveRequest;
	if (!singletons.some((s) => moduleName === s || moduleName.startsWith(`${s}/`))) {
		return resolve(context, moduleName, platform);
	}
	return resolve({ ...context, originModulePath: path.join(__dirname, 'index.ts') }, moduleName, platform);
};

module.exports = config;

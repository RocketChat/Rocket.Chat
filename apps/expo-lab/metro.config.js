const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Expo pins an exact React; the monorepo hoists a different one to the root. Force a single copy.
const singletons = ['react', 'react-dom', 'react-native', 'scheduler'];
const upstream = config.resolver.resolveRequest;
const fuselageSrc = path.resolve(__dirname, '../../packages/fuselage/src');
const emptyModule = path.join(__dirname, 'stubs/empty.js');
const tamaguiWeb = path.dirname(require.resolve('@tamagui/web/package.json'));
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../../packages/fuselage')];

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const resolve = upstream ?? context.resolveRequest;
	if (/\.s?css$/.test(moduleName)) return { type: 'sourceFile', filePath: emptyModule };
	if (moduleName === '@rocket.chat/fuselage') return { type: 'sourceFile', filePath: path.join(fuselageSrc, 'index.runtime.ts') };
	if (moduleName === '@tamagui/web') return resolve(context, tamaguiWeb, platform);
	if (!singletons.some((s) => moduleName === s || moduleName.startsWith(`${s}/`))) {
		return resolve(context, moduleName, platform);
	}
	return resolve({ ...context, originModulePath: path.join(__dirname, 'index.ts') }, moduleName, platform);
};

module.exports = config;

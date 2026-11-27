const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Expo pins an exact React; the monorepo hoists a different one to the root. Force a single copy.
const singletons = ['react', 'react-dom', 'react-native', 'scheduler'];
const upstream = config.resolver.resolveRequest;
const fuselageSrc = path.resolve(__dirname, '../../packages/fuselage/src');
const emptyModule = path.join(__dirname, 'stubs/empty.js');
const unresolvedModule = path.join(__dirname, 'stubs/unresolved.js');
const randomClient = path.resolve(__dirname, '../../packages/random/dist/main.client.js');
const probeMode = process.env.EXPO_PUBLIC_SHARED_PROBE === '1';
const tamaguiWeb =path.dirname(require.resolve('@tamagui/web/package.json'));
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../../packages/fuselage')];

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const resolve = upstream ?? context.resolveRequest;
	const native = platform !== 'web';
	if (native && /\.s?css$/.test(moduleName)) return { type: 'sourceFile', filePath: emptyModule };
	if (native && moduleName === '@rocket.chat/fuselage') return { type: 'sourceFile', filePath: path.join(fuselageSrc, 'index.runtime.ts') };
	if (moduleName === '@tamagui/web') return resolve(context, tamaguiWeb, platform);
	// The probe screen drags in the whole web client: only probe mode swaps the empty slot for it, so no other config or mode ever bundles it
	if (probeMode && /\/probeScreenSlot$/.test(moduleName)) return { type: 'sourceFile', filePath: path.join(__dirname, 'src/SharedProbeScreen.tsx') };
	// The package maps `browser` to the client build; Metro's native conditions pick the Node one (`node:crypto`)
	if (native && moduleName === '@rocket.chat/random') return { type: 'sourceFile', filePath: randomClient };
	// gazzodown-alt imports it for `renderComposerMarkup`, the only caller; the composer never calls that
	if (native && moduleName === 'react-dom/server' && /\/packages\/gazzodown-alt\//.test(context.originModulePath)) {
		return { type: 'sourceFile', filePath: emptyModule };
	}
	if (!singletons.some((s) => moduleName === s || moduleName.startsWith(`${s}/`))) {
		if (!probeMode) return resolve(context, moduleName, platform);
		try {
			return resolve(context, moduleName, platform);
		} catch {
			// Probe mode only: a dependency Metro cannot resolve throws when evaluated, so the probe reports it instead of the bundle failing
			return { type: 'sourceFile', filePath: unresolvedModule };
		}
	}
	return resolve({ ...context, originModulePath: path.join(__dirname, 'index.ts') }, moduleName, platform);
};

module.exports = config;

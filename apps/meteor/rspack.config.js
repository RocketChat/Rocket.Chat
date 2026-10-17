const path = require('path');

const { defineConfig } = require('@meteorjs/rspack');

const nodeModule = (file) => path.join(__dirname, 'node_modules', file);

// Deep imports kept for Meteor's bundler, which ignores "exports"; absolute paths bypass rspack's and Node's checks
const deepImports = {
	'swiper/modules/index.mjs': nodeModule('swiper/modules/index.mjs'),
	'swiper/swiper-react.mjs': nodeModule('swiper/swiper-react.mjs'),
	'swiper/modules/zoom.css': nodeModule('swiper/modules/zoom.css'),
	'csv-parse/lib/sync': nodeModule('csv-parse/lib/sync.js'),
};

// Server npm packages are loaded at runtime, as with Meteor's bundler; bundling them breaks native addons and optional requires.
// Deep imports into a workspace package's TypeScript sources have no runtime build, and Node would reject the deep imports above, so both are bundled.
const isServerExternal = (request) => /^[^./]/.test(request) && !/^@rocket\.chat\/[^/]+\/src\//.test(request) && !(request in deepImports);

module.exports = defineConfig((Meteor) => ({
	...(Meteor.isServer && {
		externals: [({ request }, callback) => (isServerExternal(request) ? callback(null, `commonjs ${request}`) : callback())],
	}),
	module: {
		rules: [
			// package.json declares "type": "commonjs", which makes rspack reject ESM syntax in .js files
			{ test: /\.[cm]?jsx?$/i, exclude: /node_modules/, type: 'javascript/auto' },
			{ test: /\.info$/, type: 'javascript/auto', loader: path.join(__dirname, '.rspack/info-loader.js') },
			// With symlinks unresolved, workspace TypeScript sources sit under node_modules, which the app's swc rule excludes
			{
				test: /\.tsx?$/i,
				include: /node_modules[\\/]@rocket\.chat[\\/][^\\/]+[\\/]src[\\/]/,
				loader: 'builtin:swc-loader',
				options: Meteor.swcConfigOptions,
			},
		],
	},
	resolve: {
		// Resolve workspace packages through apps/meteor/node_modules, as Meteor does, so their dependencies share the app's single copy
		symlinks: false,
		alias: {
			...Object.fromEntries(Object.entries(deepImports).map(([request, file]) => [`${request}$`, file])),
			'@rocket.chat/i18n/dist/resources': nodeModule('@rocket.chat/i18n/dist/resources'),
		},
	},
}));

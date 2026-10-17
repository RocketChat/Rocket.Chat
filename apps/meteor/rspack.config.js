const path = require('path');

const { defineConfig } = require('@meteorjs/rspack');

const swiperFile = (file) => path.join(__dirname, 'node_modules/swiper', file);

module.exports = defineConfig((Meteor) => ({
	// Server npm packages are loaded at runtime, as with Meteor's bundler; bundling them breaks native addons and optional requires
	...(Meteor.isServer && {
		// Deep imports into a workspace package's TypeScript sources have no runtime build, so they are bundled
		externals: [
			({ request }, callback) =>
				/^[^./]/.test(request) && !/^@rocket\.chat\/[^/]+\/src\//.test(request) ? callback(null, `commonjs ${request}`) : callback(),
		],
	}),
	module: {
		rules: [
			// package.json declares "type": "commonjs", which makes rspack reject ESM syntax in .js files
			{ test: /\.[cm]?jsx?$/i, exclude: /node_modules/, type: 'javascript/auto' },
			{ test: /rocketchat\.info$/, type: 'json' },
		],
	},
	resolve: {
		// Deep imports kept for Meteor's bundler, which ignores "exports"; absolute paths bypass rspack's check
		alias: {
			'swiper/modules/index.mjs$': swiperFile('modules/index.mjs'),
			'swiper/swiper-react.mjs$': swiperFile('swiper-react.mjs'),
			'swiper/modules/zoom.css$': swiperFile('modules/zoom.css'),
			'@rocket.chat/i18n/dist/resources': path.join(__dirname, 'node_modules/@rocket.chat/i18n/dist/resources'),
		},
	},
}));

'use strict';

const webpack = require('webpack');

module.exports = async ({ config }) => {
	const cssRule = config.module.rules.find(({ test }) => test.test('index.css'));
	cssRule.use[1].options.url = (url) => {
		if (/^(\.\/)?images\//.test(url)) {
			return false;
		}

		return true;
	};

	cssRule.use[2].options.plugins = [
		require('postcss-custom-properties')({ preserve: true }),
		require('postcss-media-minmax')(),
		require('postcss-selector-not')(),
		require('postcss-nested')(),
		require('autoprefixer')(),
	];

	config.module.rules.push({
		test: /\.info$/,
		type: 'json',
	});

	config.module.rules.push({
		test: /\.html$/,
		use: '@settlin/spacebars-loader',
	});

	config.plugins.push(new webpack.NormalModuleReplacementPlugin(
		/^meteor/,
		require.resolve('./meteor.js'),
	));

	config.plugins.push(new webpack.NormalModuleReplacementPlugin(
		/\.\/server\/index.js/,
		require.resolve('./empty.js'),
	));

	config.mode = 'development';
	config.optimization.usedExports = true;

	return config;
};

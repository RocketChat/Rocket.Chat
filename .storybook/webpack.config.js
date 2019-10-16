'use strict';

module.exports = async ({ config, mode }) => {
	const cssRule = config.module.rules.find(({ test }) => test.test('index.css'));
  cssRule.use[1].options.url = (url, resourcePath) => {
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

  return config;
};

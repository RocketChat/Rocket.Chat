const { resolve, relative, join } = require('path');

const { NormalModuleReplacementPlugin } = require('webpack');

module.exports = {
	stories: [
		'../app/**/*.stories.{js,tsx}',
		'../client/**/*.stories.{js,tsx}',
		'../ee/**/*.stories.{js,tsx}',
	],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-postcss',
	],
	webpackFinal: (config) => {
		const cssRule = config.module.rules.find(({ test }) => test.test('index.css'));

		cssRule.use[2].options = {
			...cssRule.use[2].options,
			postcssOptions: {
				plugins: [
					require('postcss-custom-properties')({ preserve: true }),
					require('postcss-media-minmax')(),
					require('postcss-nested')(),
					require('autoprefixer')(),
					require('postcss-url')({
						url: ({ absolutePath, relativePath, url }) => {
							const absoluteDir = absolutePath.slice(0, -relativePath.length);
							const relativeDir = relative(absoluteDir, resolve(__dirname, '../public'));
							const newPath = join(relativeDir, url);
							return newPath;
						},
					}),
				],
			},
		};

		config.module.rules.push({
			test: /\.info$/,
			type: 'json',
		});

		config.module.rules.push({
			test: /\.html$/,
			use: '@settlin/spacebars-loader',
		});

		config.plugins.push(
			new NormalModuleReplacementPlugin(
				/^meteor/,
				require.resolve('./mocks/meteor.js'),
			),
			new NormalModuleReplacementPlugin(
				/server\/*/,
				require.resolve('./mocks/empty.ts'),
			),
		);

		return config;
	},
};

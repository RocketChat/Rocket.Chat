const { resolve, relative, join } = require('path');

const webpack = require('webpack');

module.exports = {
	typescript: {
		reactDocgen: 'none',
	},
	stories: [
		'../app/**/*.stories.{js,tsx}',
		'../client/**/*.stories.{js,tsx}',
		'../ee/**/*.stories.{js,tsx}',
	],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-postcss',
	],
	webpackFinal: async (config) => {
		const cssRule = config.module.rules.find(({ test }) => test.test('index.css'));

		cssRule.use[2].options = {
			...cssRule.use[2].options,
			postcssOptions: {
				plugins: [
					require('postcss-custom-properties')({ preserve: true }),
					require('postcss-media-minmax')(),
					require('postcss-nested')(),
					require('autoprefixer')(),
					require('postcss-url')({ url: ({ absolutePath, relativePath, url }) => {
						const absoluteDir = absolutePath.slice(0, -relativePath.length);
						const relativeDir = relative(absoluteDir, resolve(__dirname, '../public'));
						const newPath = join(relativeDir, url);
						return newPath;
					} }),
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

		config.module.rules.push({
			test: /\.(ts|tsx)$/,
			use: [
				{
					loader: 'ts-loader',
					options: {
						configFile: join(__dirname, '../tsconfig.webpack.json'),
					},
				},
			],
		});

		config.plugins.push(
			new webpack.NormalModuleReplacementPlugin(
				/^meteor/,
				require.resolve('./mocks/meteor.js'),
			),
			new webpack.NormalModuleReplacementPlugin(
				/(app)\/*.*\/(server)\/*/,
				require.resolve('./mocks/empty.ts'),
			),
		);

		config.mode = 'development';
		config.optimization.usedExports = true;

		return config;
	},
};

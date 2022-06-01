const { resolve, relative, join } = require('path');

const glob = require('glob');
const webpack = require('webpack');

const getStories = () => [
	...glob.sync(`${__dirname}/../client/**/*.stories.{js,tsx}`, {
		ignore: ['**/node_modules/**'],
	}),
	...glob.sync(`${__dirname}/../app/**/*.stories.{js,tsx}`, {
		ignore: ['**/node_modules/**'],
	}),
	...glob.sync(`${__dirname}/../ee/**/*.stories.{js,tsx}`, {
		ignore: ['**/node_modules/**'],
	}),
];

module.exports = {
	stories: [...getStories()],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		{
			name: '@storybook/addon-postcss',
			options: {
				postcssLoaderOptions: {
					implementation: require('postcss'),
				},
			},
		},
	],
	webpackFinal: async (config) => {
		const cssRule = config.module.rules.find(({ test }) => test.test('index.css'));

		cssRule.use[2].options = {
			...cssRule.use[2].options,
			postcssOptions: {
				plugins: [
					['postcss-custom-properties', { preserve: true }],
					'postcss-media-minmax',
					'postcss-nested',
					'autoprefixer',
					[
						'postcss-url',
						{
							url: ({ absolutePath, relativePath, url }) => {
								const absoluteDir = absolutePath.slice(0, -relativePath.length);
								const relativeDir = relative(absoluteDir, resolve(__dirname, '../public'));
								const newPath = join(relativeDir, url);
								return newPath;
							},
						},
					],
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
			new webpack.NormalModuleReplacementPlugin(/^meteor/, require.resolve('./mocks/meteor.js')),
			new webpack.NormalModuleReplacementPlugin(/(app)\/*.*\/(server)\/*/, require.resolve('./mocks/empty.ts')),
		);

		config.mode = 'development';
		config.optimization.usedExports = true;

		return config;
	},
};

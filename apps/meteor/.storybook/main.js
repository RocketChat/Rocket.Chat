const { resolve, relative, join } = require('path');

const webpack = require('webpack');

module.exports = {
	stories: [
		'../client/**/*.stories.{js,tsx}',
		'../app/**/*.stories.{js,tsx}',
		'../ee/app/**/*.stories.{js,tsx}',
		'../ee/client/**/*.stories.{js,tsx}',
	],
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
	typescript: {
		reactDocgen: 'react-docgen-typescript-plugin',
	},
	webpackFinal: async (config) => {
		// Those aliases are needed because dependencies in the monorepo use another
		// dependencies that are not hoisted on this workspace
		config.resolve.alias = {
			'react$': require.resolve('../../../node_modules/react'),
			// 'react/jsx-runtime': require.resolve('../../../node_modules/react/jsx-runtime'),
			'@tanstack/react-query': require.resolve('../../../node_modules/@tanstack/react-query'),
		};

		config.module.rules.push({
			test: /\.mjs$/,
			include: /node_modules/,
			type: 'javascript/auto',
		});

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

import type { StorybookConfig } from '@storybook/core-common';
import { NormalModuleReplacementPlugin } from 'webpack';

export default {
	stories: ['../client/**/*.stories.{js,tsx}', '../app/**/*.stories.{js,tsx}', '../ee/app/**/*.stories.{js,tsx}'],
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
		{
			name: '@newhighsco/storybook-addon-transpile-modules',
			options: {
				transpileModules: ['date-fns', 'typia', 'react-i18next', '@react-spring/shared', '@react-spring/core', 'sip.js'],
			},
		},
	],
	typescript: {
		reactDocgen: 'react-docgen-typescript',
	},
	webpackFinal: async (config) => {
		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
				'react$': require.resolve('../node_modules/react'),
				'react-dom$': require.resolve('../node_modules/react-dom'),
				'react-i18next$': require.resolve('../node_modules/react-i18next'),
				'@rocket.chat/mock-providers$': require.resolve('../node_modules/@rocket.chat/mock-providers'),
				'@tanstack/react-query$': require.resolve('../node_modules/@tanstack/react-query'),
			},
		};

		config.module?.rules?.push({
			test: /\.mjs$/,
			include: /node_modules/,
			type: 'javascript/auto',
		});

		config.plugins?.push(
			new NormalModuleReplacementPlugin(/^meteor/, require.resolve('./mocks/meteor.js')),
			new NormalModuleReplacementPlugin(/\/rocketchat\.info$/, require.resolve('./mocks/rocketchatinfo.js')),
			new NormalModuleReplacementPlugin(/(app)\/*.*\/(server)\/*/, require.resolve('./mocks/empty.ts')),
		);

		return config;
	},
} satisfies StorybookConfig;

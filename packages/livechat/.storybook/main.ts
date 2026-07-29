import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/preact-webpack5';
import type { RuleSetRule } from 'webpack';

const config: StorybookConfig = {
	stories: ['../src/**/{*.story,story,*.stories,stories}.tsx'],

	addons: [
		'@storybook/addon-docs',
		{
			name: '@storybook/addon-styling-webpack',
			options: {
				rules: [
					{
						test: /\.s?css$/,
						sideEffects: true,
						use: [
							'style-loader',
							{
								loader: 'css-loader',
								options: {
									modules: {
										localIdentName: '[local]__[hash:base64:5]',
									},
									importLoaders: 1,
									sourceMap: true,
								},
							},
							{
								loader: 'postcss-loader',
								options: {
									implementation: 'postcss',
								},
							},
							{
								loader: 'sass-loader',
								options: {
									implementation: 'sass',
									sourceMap: true,
									sassOptions: {},
								},
							},
						],
					},
				],
			},
		},
		'@storybook/addon-webpack5-compiler-swc',
		'storybook-dark-mode',
	],

	framework: {
		name: '@storybook/preact-webpack5',
		options: {},
	},

	typescript: {},

	webpackFinal: async (config) => {
		const dateFnsRoot = dirname(require.resolve('date-fns/package.json'));
		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
				[require.resolve('../src/lib/uiKit')]: require.resolve('./mocks/uiKit.ts'),
				// date-fns v4's `exports` map doesn't expose the `./locale` directory
				// for enumeration, so webpack's dynamic `import()` context fails. Alias
				// to the on-disk folder to bypass `exports`.
				'date-fns/locale$': join(dateFnsRoot, 'locale'),
			},
		};

		const isRuleSetRule = (rule: any): rule is RuleSetRule => typeof rule === 'object';

		config.module?.rules?.filter(isRuleSetRule).forEach((rule) => {
			if (String(rule.test) === String(/\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/)) {
				rule.test = /\.(ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/;
			}
		});

		config.module?.rules?.push({
			test: /\.svg$/,
			exclude: /logo\.svg/,
			use: ['desvg-loader/preact', 'svg-loader'],
		});

		config.module?.rules?.push({
			test: /logo\.svg(\?.*)?$/,
			type: 'asset/resource',
			generator: { filename: 'static/media/[path][name][ext]' },
		});

		return config;
	},
};

export default config;

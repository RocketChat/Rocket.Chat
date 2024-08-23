import { type StorybookConfig } from '@storybook/core-common';
import { type RuleSetRule } from 'webpack';

const config: StorybookConfig = {
	stories: ['../src/**/{*.story,story,*.stories,stories}.{js,tsx}'],
	addons: [
		{
			name: '@storybook/addon-essentials',
			options: {
				backgrounds: false,
			},
		},
		'@storybook/addon-postcss',
		'storybook-dark-mode',
	],
	core: {
		builder: 'webpack4',
	},
	webpackFinal: async (config) => {
		if (!config.resolve || !config.module) {
			throw new Error('Invalid webpack config');
		}

		config.resolve.alias = {
			...config.resolve.alias,
			'react': 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat',
			'react/jsx-runtime': 'preact/jsx-runtime',
			[require.resolve('../src/lib/uiKit')]: require.resolve('./mocks/uiKit.ts'),
		};

		const isRuleSetRule = (rule: any): rule is RuleSetRule => typeof rule === 'object';

		config.module.rules ??= [];

		config.module.rules = config.module.rules.filter(
			(rule) => isRuleSetRule(rule) && (typeof rule.loader !== 'string' || !/json-loader/.test(rule.loader)),
		);

		const fileLoader = config.module.rules.find(
			(rule): rule is RuleSetRule => isRuleSetRule(rule) && typeof rule.loader === 'string' && /file-loader/.test(rule.loader),
		);
		if (!fileLoader) {
			throw new Error('Invalid webpack config');
		}
		fileLoader.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf|mp3|mp4)(\?.*)?$/;

		const urlLoader = config.module.rules
			?.filter(isRuleSetRule)
			.find(({ loader }) => typeof loader === 'string' && /url-loader/.test(loader));
		if (!urlLoader) {
			throw new Error('Invalid webpack config');
		}
		urlLoader.test = /\.(webm|wav|m4a|aac|oga)(\?.*)?$/;

		config.module.rules.push({
			test: /\.mjs$/,
			include: /node_modules/,
			type: 'javascript/auto',
			use: {
				loader: require.resolve('babel-loader'),
			},
		});

		config.module.rules.push({
			test: /\.scss$/,
			use: [
				'style-loader',
				{
					loader: 'css-loader',
					options: {
						sourceMap: true,
						modules: true,
						importLoaders: 1,
					},
				},
				'sass-loader',
			],
		});

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const path = require('path');

		const logoPath = path.resolve(path.join(__dirname, './logo.svg'));

		config.module.rules.push({
			...fileLoader,
			test: (srcPath) => srcPath === logoPath,
		});

		config.module.rules.push({
			test: (srcPath) => srcPath.endsWith('.svg') && srcPath !== logoPath,
			use: ['desvg-loader/preact', 'svg-loader'],
		});

		return config;
	},
};

module.exports = config;

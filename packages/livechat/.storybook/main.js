/** @type {import('@storybook/core-common').StorybookConfig} */
const config = {
	stories: ['../src/**/{*.story,story,*.stories,stories}.{js,tsx}'],
	addons: [
		{
			name: '@storybook/addon-essentials',
			options: {
				backgrounds: false,
			},
		},
		'@storybook/addon-postcss',
	],
	core: {
		builder: 'webpack4',
	},
	webpackFinal: async (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'react': 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat',
			'react/jsx-runtime': 'preact/jsx-runtime',
			[require.resolve('../src/lib/uiKit')]: require.resolve('./mocks/uiKit'),
		};

		config.module.rules = config.module.rules.filter(({ loader }) => !/json-loader/.test(loader));

		const fileLoader = config.module.rules.find(({ loader }) => /file-loader/.test(loader));
		fileLoader.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf|mp3|mp4)(\?.*)?$/;

		const urlLoader = config.module.rules.find(({ loader }) => /url-loader/.test(loader));
		urlLoader.test = /\.(webm|wav|m4a|aac|oga)(\?.*)?$/;

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

		config.module.rules.push({
			test: /\.svg$/,
			exclude: [__dirname],
			use: ['desvg-loader/preact', 'svg-loader'],
		});

		return config;
	},
};

module.exports = config;

import { dirname, join, resolve } from 'path';

import baseConfig from '@rocket.chat/storybook-config/main';
import webpack from 'webpack';

export default baseConfig({
	stories: ['../client/**/*.stories.{js,tsx}'],

	webpackFinal: async (config) => {
		// Those aliases are needed because dependencies in the monorepo use another
		// dependencies that are not hoisted on this workspace
		const swiperRoot = dirname(require.resolve('swiper/package.json'));
		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
				'react$': require.resolve('../../../node_modules/react'),
				// 'react/jsx-runtime': require.resolve('../../../node_modules/react/jsx-runtime'),
				'@tanstack/react-query': require.resolve('../../../node_modules/@tanstack/react-query'),
				'@rocket.chat/fuselage$': require.resolve('../../../node_modules/@rocket.chat/fuselage'),
				// Meteor's bundler ignores the `exports` field, so source code reaches
				// into swiper's internals via deep file paths. Webpack honors `exports`
				// and rejects them, so map each subpath to the actual file.
				'swiper/swiper-react.mjs$': join(swiperRoot, 'swiper-react.mjs'),
				'swiper/swiper-react$': join(swiperRoot, 'swiper-react.d.ts'),
				'swiper/modules/index.mjs$': join(swiperRoot, 'modules/index.mjs'),
				'swiper/swiper.css$': join(swiperRoot, 'swiper.css'),
				'swiper/modules/zoom.css$': join(swiperRoot, 'modules/zoom.css'),
			},
			// This is only needed because of Rocket.Chat's icon font.
			roots: [...(config.resolve?.roots ?? []), resolve(__dirname, '../../../apps/meteor/public')],
		};

		// Strip the `env` option that addon-webpack5-compiler-swc injects on swc-loader;
		// it conflicts with `jsc.target` from `.swcrc` (Meteor's Modern Build Stack).
		for (const rule of (config.module?.rules ?? []) as any[]) {
			for (const use of Array.isArray(rule?.use) ? rule.use : []) {
				if (use?.loader?.includes?.('swc-loader') && use.options) delete use.options.env;
			}
		}

		config.plugins?.push(
			new webpack.NormalModuleReplacementPlugin(/^meteor/, require.resolve('./mocks/meteor.ts')),
			new webpack.NormalModuleReplacementPlugin(/(app)\/*.*\/(server)\/*/, require.resolve('./mocks/empty.ts')),
			new webpack.NormalModuleReplacementPlugin(/rocketchat\.info$/, require.resolve('./mocks/rocketchat.info.ts')),
		);

		return config;
	},
});

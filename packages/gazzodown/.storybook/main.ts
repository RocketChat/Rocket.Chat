import { resolve } from 'node:path';

import baseConfig from '@rocket.chat/storybook-config/main';

export default baseConfig({
	webpackFinal: (config) => {
		// This is only needed because of Rocket.Chat's icon font.
		config.resolve = {
			...config.resolve,
			roots: [...(config.resolve?.roots ?? []), resolve(__dirname, '../../../apps/meteor/public')],
		};

		return config;
	},
});

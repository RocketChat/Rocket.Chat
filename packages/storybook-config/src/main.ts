import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

const baseConfig = (customConfig?: Partial<StorybookConfig>): StorybookConfig => {
	return {
		stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
		addons: [
			getAbsolutePath('@storybook/addon-a11y'),
			getAbsolutePath('@storybook/addon-docs'),
			getAbsolutePath('@rocket.chat/storybook-dark-mode'),
			getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
			getAbsolutePath('@storybook/addon-styling-webpack'),
		],
		framework: {
			name: getAbsolutePath('@storybook/react-webpack5'),
			options: {},
		},
		typescript: {
			reactDocgen: 'react-docgen',
		},
		env: (config, { configDir }) => ({
			...config,
			STORYBOOK_PACKAGE_NAME: JSON.parse(readFileSync(join(configDir, '..', 'package.json'), 'utf8')).name,
		}),
		...customConfig,
	};
};

export default baseConfig;

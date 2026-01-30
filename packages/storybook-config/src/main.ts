import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

const baseConfig = (customConfig?: StorybookConfig): StorybookConfig => {
	return {
		stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
		addons: [
			getAbsolutePath('@storybook/addon-a11y'),
			getAbsolutePath('@storybook/addon-essentials'),
			getAbsolutePath('storybook-dark-mode'),
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
		...customConfig,
	};
};

export default baseConfig;

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-webpack5';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

const baseConfig = ({ staticDirs = [], ...customConfig }: Partial<StorybookConfig> = {}): StorybookConfig => {
	return {
		stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
		addons: [
			getAbsolutePath('@storybook/addon-a11y'),
			getAbsolutePath('@storybook/addon-docs'),
			fileURLToPath(import.meta.resolve('./preset.js')),
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
		staticDirs: async (dirs, options) => (typeof staticDirs === 'function' ? staticDirs(dirs, options) : [...(dirs ?? []), ...staticDirs]),
		...customConfig,
	};
};

export default baseConfig;

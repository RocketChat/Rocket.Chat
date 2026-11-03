import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

const fuselageFontsDir = dirname(require.resolve('@rocket.chat/fuselage/dist/fonts/InterVariable.woff2'));

const fuselageFontFaces = `<style>
	@font-face {
		font-family: 'Inter';
		font-weight: 100 900;
		font-style: normal;
		font-display: swap;
		src: url('./fuselage-fonts/InterVariable.woff2') format('woff2');
	}
</style>`;

const baseConfig = ({ staticDirs = [], managerHead, ...customConfig }: Partial<StorybookConfig> = {}): StorybookConfig => {
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
		staticDirs: async (dirs, options) => {
			const customDirs = typeof staticDirs === 'function' ? await staticDirs(dirs, options) : staticDirs;
			return [{ from: fuselageFontsDir, to: '/fuselage-fonts' }, ...(customDirs ?? [])];
		},
		managerHead: async (head, options) => {
			const customHead = typeof managerHead === 'function' ? await managerHead(head, options) : (managerHead ?? head);
			return `${customHead}${fuselageFontFaces}`;
		},
		...customConfig,
	};
};

export default baseConfig;

declare module 'eslint-plugin-jsx-a11y' {
	import type { ConfigArray } from 'typescript-eslint';
	export const flatConfigs: {
		recommended: ConfigArray;
	};
	export default {
		meta: {
			name: string,
			version: string,
		},
		flatConfigs,
	};
}

declare module 'eslint-plugin-storybook' {
	import { ConfigArray } from 'typescript-eslint';
	export const configs: {
		'flat/recommended': ConfigArray;
	};
}

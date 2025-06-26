declare module 'eslint-plugin-security' {
	import { ConfigArray } from 'typescript-eslint';
	export const configs: {
		recommended: ConfigArray;
	};
}

declare module 'eslint-plugin-jsx-a11y' {
	import { ConfigArray } from 'typescript-eslint';
	export const flatConfigs: {
		recommended: ConfigArray;
	};
}

declare module 'eslint-plugin-storybook' {
	import { ConfigArray } from 'typescript-eslint';
	export const configs: {
		'flat/recommended': ConfigArray;
	};
}

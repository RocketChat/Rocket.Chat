import fs from 'node:fs/promises';

import { flatConfigsToRulesDTS } from 'eslint-typegen/core';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
// import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import mocha from 'eslint-plugin-mocha';
// import prettier from 'eslint-config-prettier/flat';
import testingLibrary from 'eslint-plugin-testing-library';
import storybook from 'eslint-plugin-storybook';
import jsxAlly from 'eslint-plugin-jsx-a11y';
import security from 'eslint-plugin-security';

import type { ESLint, Linter } from 'eslint';

const configs = [
	{
		plugins: {
			'': {
				rules: Object.fromEntries(builtinRules.entries()),
			},
		},
	},
	...tseslint.configs.all,
	jest.configs['flat/all'],
	importX.flatConfigs.recommended,
	react.configs.flat.all,
	reactHooks.configs['recommended-latest'],
	reactRefresh.configs.recommended,
	mocha.configs?.all,
	testingLibrary.configs['flat/react'],
	{
		plugins: {
			'jsx-a11y': jsxAlly as ESLint.Plugin,
		},
	},
	// prettier.configs,
	...(storybook as unknown as typeof import('eslint-plugin-storybook').default).configs['flat/recommended'],
	...('recommended' in security.configs ? [security.configs.recommended] : []),
	// typeof jsxAlly === 'object' && 'flatConfigs' in jsxAlly ? [jsxAlly.flatConfigs.recommended] : [],
] as Linter.Config[];

const dts = await flatConfigsToRulesDTS(configs, {
	includeAugmentation: false,
});

await fs.writeFile('src/typegen.d.ts', dts);

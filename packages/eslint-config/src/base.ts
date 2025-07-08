import eslint from '@eslint/js';
import tseslint, { type InfiniteDepthConfigWithExtends } from 'typescript-eslint';
import globals from 'globals';
import { importX } from 'eslint-plugin-import-x';
import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import { ignore } from './config/ignore.js';

import javascript from './rules/javascript.js';
import security from './configs/security.js';
import prettier from './configs/prettier.js';

interface Plugin {
	rules?: Record<
		string,
		| {
				create: unknown;
				meta?: {
					message?: string;
					/**
					 * URL to more information about this deprecation in general.
					 */
					url?: string;
					/**
					 * An empty array explicitly states that there is no replacement.
					 */
					replacedBy?: unknown[];
					/**
					 * The package version since when the rule is deprecated (should use full
					 * semver without a leading "v").
					 */
					deprecatedSince?: string;
					/**
					 * The estimated version when the rule is removed (probably the next major
					 * version). null means the rule is "frozen" (will be available but will not
					 * be changed).
					 */
					availableUntil?: string | null;
				};
		  }
		| ((...args: unknown[]) => unknown)
	>;
}

const getDeprecatedRules = (plugins: Record<string, Omit<Plugin, 'configs'>>) => {
	const deprecated: string[] = [];
	for (const [pluginName, plugin] of Object.entries(plugins)) {
		if (plugin.rules) {
			for (const [ruleName, rule] of Object.entries(plugin.rules)) {
				if ('meta' in rule && rule.meta && 'deprecated' in rule.meta && rule.meta.deprecated) {
					deprecated.push(`${pluginName}/${ruleName}`);
				}
			}
		}
	}
	return deprecated;
};

export default async function base(
	...configs: (Promise<InfiniteDepthConfigWithExtends> | InfiniteDepthConfigWithExtends)[]
): Promise<FlatConfig.ConfigArray> {
	const resolvedConfigs = await Promise.all(configs);

	const resultConfigs = tseslint.config(
		{
			name: 'base',
		},
		ignore([
			'**/scripts/**',
			'**/dist/**',
			'**/public/**',
			'**/.meteor/**',
			'.mocha.api.js',
			'.mocharc.js',
			'.mocharc.*.js',
			'**/.storybook/**',
			'babel.config.js',
			'eslint.config.mjs',
			'jest.config.ts',
			'webpack.config.js',
			'.prettierrc.js',
			'**/coverage/**',
		]),
		eslint.configs.recommended,
		{
			rules: javascript.recommended,
		},
		importX.flatConfigs.recommended,
		importX.flatConfigs.typescript,
		tseslint.configs.recommendedTypeChecked,
		prettier(),
		security({ rules: { 'security/detect-object-injection': 'off' } }),
		{
			rules: {
				'prefer-const': 'warn',
			},
		},
		{
			rules: {
				'import-x/namespace': 'warn',
				'import-x/export': 'warn',
				'import-x/no-unresolved': 'warn',
				'import-x/no-dynamic-require': 'warn',
				'import-x/default': 'warn',
				'import-x/order': 'error',
			},
		},
		{
			rules: {
				/**
				 * {@link tseslintPlugin.rules}
				 */
				'@typescript-eslint/ban-ts-comment': 'warn',
				'@typescript-eslint/no-explicit-any': 'warn',
				'@typescript-eslint/no-empty-object-type': 'warn',
				/**
				 * @deprecated in favor of `@typescript-eslint/no-empty-object-type`
				 */
				'@typescript-eslint/no-empty-interface': 'off',
				'@typescript-eslint/no-unsafe-declaration-merging': 'warn',
				'@typescript-eslint/no-require-imports': 'warn',
				'@typescript-eslint/no-this-alias': 'warn',
				'@typescript-eslint/no-unused-expressions': 'warn',
				'@typescript-eslint/no-unsafe-assignment': 'warn',
				'@typescript-eslint/no-unsafe-member-access': 'warn',
				'@typescript-eslint/require-await': 'warn',
				'@typescript-eslint/no-unsafe-argument': 'warn',
				'@typescript-eslint/no-unsafe-return': 'warn',
				'@typescript-eslint/no-unsafe-call': 'warn',
				'@typescript-eslint/unbound-method': 'warn',
				'@typescript-eslint/restrict-template-expressions': 'warn',
				'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
				'@typescript-eslint/await-thenable': 'warn',
				'@typescript-eslint/no-misused-promises': 'warn',
				'@typescript-eslint/no-floating-promises': 'warn',
				'@typescript-eslint/prefer-promise-reject-errors': 'warn',
				'@typescript-eslint/no-redundant-type-constituents': 'warn',
				'@typescript-eslint/restrict-plus-operands': 'warn',
				'@typescript-eslint/no-implied-eval': 'warn',
				'@typescript-eslint/no-duplicate-type-constituents': 'warn',
				'@typescript-eslint/no-unsafe-enum-comparison': 'warn',
				'@typescript-eslint/only-throw-error': 'warn',
				'@typescript-eslint/no-base-to-string': 'warn',
				'@typescript-eslint/no-for-in-array': 'warn',
				'@typescript-eslint/no-array-delete': 'warn',
				'@typescript-eslint/no-non-null-assertion': 'warn',
				'@typescript-eslint/naming-convention': [
					'warn',
					{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
					{
						selector: ['variable'],
						format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
						leadingUnderscore: 'allowSingleOrDouble',
					},
					{
						selector: ['function'],
						format: ['camelCase', 'PascalCase'],
						leadingUnderscore: 'allowSingleOrDouble',
					},
					{
						selector: 'parameter',
						format: ['camelCase'],
						modifiers: ['unused'],
						leadingUnderscore: 'require',
					},
					{
						selector: 'interface',
						format: ['PascalCase'],
						custom: {
							regex: '^I[A-Z]',
							match: true,
						},
					},
					{
						selector: 'variable',
						modifiers: ['destructured'],
						format: null,
					},
					{
						selector: 'parameter',
						modifiers: ['destructured'],
						format: null,
					},
				],
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						argsIgnorePattern: '^_',
						ignoreRestSiblings: true,
						caughtErrors: 'none',
					},
				],
			},
		},
		{
			languageOptions: {
				globals: globals.node,
				parserOptions: {
					projectService: true,
				},
			},
		},
		...resolvedConfigs,
		{
			files: [
				'**/*.spec.ts',
				'**/__tests__/**/*.ts',
				'**/*.test.ts',
				'**/tests/**/*.ts',
				'**/__mocks__/**/*.ts',
				'**/__examples__/**/*.ts',
			],
			extends: [tseslint.configs.disableTypeChecked],
		},
	);

	const allDeprecatedRules = new Set<string>();

	for (const config of resultConfigs) {
		if (config.plugins) {
			const deprecatedRules = getDeprecatedRules(config.plugins);
			for (const rule of deprecatedRules) {
				allDeprecatedRules.add(rule);
			}
		}
	}

	const usedDeprecatedRules = new Set<string>();

	for (const config of resultConfigs) {
		if (config.rules) {
			const keys = Object.keys(config.rules);
			for (const key of keys) {
				if (allDeprecatedRules.has(key)) {
					if (config.rules[key] !== 'off') {
						console.warn(`Deprecated rule "${key}" is used in the config. It has been turned off.`);
						config.rules[key] = 'off';
						usedDeprecatedRules.add(key);
					}
				}
			}
		}
	}

	if (usedDeprecatedRules.size > 0) {
		throw new Error(`The following deprecated rules are used in the config: \n\t- ${Array.from(usedDeprecatedRules).join('\n\t- ')}`);
	}

	return resultConfigs;
}

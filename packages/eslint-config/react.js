/** @type {import('eslint').ESLint.ConfigData} */
const config = {
	plugins: ['react', 'react-hooks', 'jsx-a11y'],
	extends: ['plugin:jsx-a11y/recommended'],
	rules: {
		'react-hooks/exhaustive-deps': 'error',
		'react-hooks/rules-of-hooks': 'error',
		'react/display-name': 'error',
		'react/jsx-curly-brace-presence': 'error',
		'react/jsx-fragments': ['error', 'syntax'],
		'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
		'react/jsx-no-undef': 'error',
		'react/jsx-uses-react': 'error',
		'react/jsx-uses-vars': 'error',
		'react/no-multi-comp': 'error',
		'jsx-a11y/no-autofocus': [2, { ignoreNonDOM: true }],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	overrides: [
		{
			files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
			rules: {
				'react/display-name': 'off',
				'react/no-multi-comp': 'off',
			},
		},
	],
};

module.exports = config;

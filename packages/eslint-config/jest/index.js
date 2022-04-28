module.exports = {
	plugins: ['jest'],
	overrides: [
		{
			files: ['**/*.spec.ts', '**/*.spec.tsx'],
			env: { 'jest/globals': true },
			plugins: ['jest'],
			extends: ['plugin:jest/recommended'],
		},
	],
};

/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/*.spec.ts', '**/*.test.ts'],
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: '<rootDir>/tsconfig.json',
			},
		],
	},
	collectCoverageFrom: ['src/**/*.ts'],
	coverageDirectory: 'coverage',
};

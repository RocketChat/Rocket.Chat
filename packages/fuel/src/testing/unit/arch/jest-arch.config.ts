export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['<rootDir>/tests/unit/architecture/**/*.spec.ts'],
	transform: {
		'^.+\\.(t|j)s?$': '@swc/jest',
	},
};

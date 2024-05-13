export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/worker.spec.ts'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
};

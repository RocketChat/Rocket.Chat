export default {
	errorOnDeprecated: true,

	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: [
		'<rootDir>/client/**/**.spec.[jt]s?(x)',
		'<rootDir>/tests/unit/client/views/**/*.spec.{ts,tsx}',
		'<rootDir>/tests/unit/client/providers/**/*.spec.{ts,tsx}',
	],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
		'^react($|/.+)': '<rootDir>/node_modules/react$1',
	},
	collectCoverage: true,
};

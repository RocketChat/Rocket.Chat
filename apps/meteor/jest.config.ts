export default {
	errorOnDeprecated: true,

	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['<rootDir>/client/sidebar/**/**.spec.[jt]s?(x)'],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
		'^react($|/.+)': '<rootDir>/node_modules/react$1',
	},
};

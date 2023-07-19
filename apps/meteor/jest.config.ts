export default {
	errorOnDeprecated: true,

	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: [
		'<rootDir>/client/hooks/**.spec.[jt]s?(x)',
		'<rootDir>/client/components/**.spec.[jt]s?(x)',
		'<rootDir>client/components/message/content/reactions/**.spec.[jt]s?(x)',
		'<rootDir>/client/sidebar/header/actions/hooks/**/**.spec.[jt]s?(x)',
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

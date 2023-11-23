export default {
	errorOnDeprecated: true,

	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: [
		'<rootDir>/ee/app/authorization/server/validateUserRoles.spec.ts',
		'<rootDir>/client/**/**.spec.[jt]s?(x)',
		'<rootDir>/tests/unit/client/views/**/*.spec.{ts,tsx}',
		'<rootDir>/tests/unit/client/providers/**/*.spec.{ts,tsx}',
	],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	transformIgnorePatterns: ['!node_modules/jose'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
		'^react($|/.+)': '<rootDir>/node_modules/react$1',
		'^@tanstack/(.+)': '<rootDir>/node_modules/@tanstack/$1',
	},
	collectCoverage: true,
};

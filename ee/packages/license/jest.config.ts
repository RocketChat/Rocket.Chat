export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['**/**.spec.ts'],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	// transformIgnorePatterns: ['!node_modules/jose'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
		'^jose$': require.resolve('jose'),
	},
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
};

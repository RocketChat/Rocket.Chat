module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	errorOnDeprecated: true,
	testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
	globals: {
		'ts-jest': {
			tsconfig: {
				noUnusedLocals: false,
				noUnusedParameters: false,
			},
		},
	},
};

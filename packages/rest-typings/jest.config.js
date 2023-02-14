module.exports = {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	globals: {
		'ts-jest': {
			tsconfig: {
				noUnusedLocals: false,
				noUnusedParameters: false,
			},
		},
	},
};

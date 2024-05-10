export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					parser: {
						syntax: 'typescript',
						tsx: true,
						decorators: false,
						dynamicImport: true,
					},
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
				},
			},
		],
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
};

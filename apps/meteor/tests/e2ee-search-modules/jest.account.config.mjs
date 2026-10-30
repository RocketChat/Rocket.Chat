import config from '../../jest.config.mjs';

const client = config.projects.find((project) => project.displayName === 'client');

export default {
	...config,
	projects: [
		{
			...client,
			rootDir: new URL('../../', import.meta.url).pathname,
			testMatch: ['<rootDir>/client/views/account/security/{LocalSearchOptIn,ResetPassphrase,EndToEnd}.spec.tsx'],
		},
	],
	collectCoverage: false,
	cacheDirectory: new URL('./.cache/account-jest', import.meta.url).pathname,
};

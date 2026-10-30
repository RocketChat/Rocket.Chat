import config from './jest.config.mjs';

export default {
	...config,
	projects: config.projects.map((project) => ({
		...project,
		testMatch: ['<rootDir>/client/lib/e2eeSearch/searchIndexRuntime.spec.ts'],
	})),
	collectCoverage: false,
	cacheDirectory: new URL('./.cache/runtime-jest', import.meta.url).pathname,
};

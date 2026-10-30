import config from '../../jest.config.mjs';

const client = config.projects.find((project) => project.displayName === 'client');

export default {
	...config,
	projects: [
		{
			...client,
			rootDir: new URL('../../', import.meta.url).pathname,
			moduleNameMapper: {
				'^@rocket.chat/core-typings$': '<rootDir>/tests/e2ee-search-modules/coreTypings.ts',
				'^@rocket.chat/desktop-api$': '<rootDir>/../../packages/desktop-api/src/e2eeSearch.ts',
				...client.moduleNameMapper,
			},
		},
	],
};

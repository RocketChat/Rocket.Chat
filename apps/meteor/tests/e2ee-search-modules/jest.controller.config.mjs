import config from '../../jest.config.mjs';

const client = config.projects.find((project) => project.displayName === 'client');

export default {
	...config,
	collectCoverage: false,
	projects: [
		{
			...client,
			rootDir: new URL('../../', import.meta.url).pathname,
			testMatch: ['<rootDir>/client/views/room/contextualBar/MessageSearchTab/**/*.spec.[jt]s?(x)'],
			moduleNameMapper: {
				'^@rocket.chat/desktop-api$': '<rootDir>/../../packages/desktop-api/src/e2eeSearch.ts',
				...client.moduleNameMapper,
			},
		},
	],
};

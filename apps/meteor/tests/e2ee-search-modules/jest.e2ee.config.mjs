import config from '../../jest.config.mjs';

export default {
	...config,
	projects: config.projects
		.filter((project) => project.displayName === 'client')
		.map((project) => ({
			...project,
			rootDir: new URL('../../', import.meta.url).pathname,
			moduleNameMapper: {
				'^@rocket.chat/desktop-api$': '<rootDir>/../../packages/desktop-api/src/e2eeSearch.ts',
				...project.moduleNameMapper,
			},
			setupFilesAfterEnv: [...project.setupFilesAfterEnv, '<rootDir>/tests/e2ee-search-modules/mockSearchIntegration.ts'],
		})),
};

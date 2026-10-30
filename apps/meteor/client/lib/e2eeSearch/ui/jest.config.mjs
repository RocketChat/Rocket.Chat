import config from '../../../../jest.config.mjs';

const client = config.projects.find((project) => project.displayName === 'client');

export default {
	...config,
	projects: [
		{
			...client,
			rootDir: new URL('../../../../', import.meta.url).pathname,
			testMatch: ['<rootDir>/client/lib/e2eeSearch/ui/**/*.spec.tsx'],
		},
	],
};

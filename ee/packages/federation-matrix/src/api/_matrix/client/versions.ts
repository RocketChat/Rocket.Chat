import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import { license, tags } from './_shared';

const VersionsResponseSchema = {
	type: 'object',
	properties: {},
};

const isVersionsResponseProps = ajv.compile(VersionsResponseSchema);

export const addVersionsRoutes = (router: ClientRouter) => {
	router.get(
		'/versions',
		{
			response: { 200: isVersionsResponseProps },
			tags,
			license,
		},
		async () => ({
			body: {},
			statusCode: 200,
		}),
	);
};

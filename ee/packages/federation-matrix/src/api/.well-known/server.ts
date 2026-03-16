import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import { createHash } from 'node:crypto';

import { federationSDK } from '@rocket.chat/federation-sdk';

const WellKnownServerResponseSchema = {
	type: 'object',
	properties: {
		'm.server': {
			type: 'string',
			description: 'Matrix server address with port',
		},
	},
	required: ['m.server'],
};

const isWellKnownServerResponseProps = ajv.compile(WellKnownServerResponseSchema);

// TODO: After changing the domain setting this route is still reporting the old domain until the server is restarted
// TODO: this is wrong, is siteurl !== domain this path should return 404. this path is to discover the final address, domain being the "proxy" and siteurl the final destination, if domain is different, well-known should be served there, not here.
export const getWellKnownRoutes = () => {
	return new Router('/matrix').get(
		'/server',
		{
			response: {
				200: isWellKnownServerResponseProps,
			},
			tags: ['Well-Known'],
			license: ['federation'],
		},
		async (c) => {
			const responseData = federationSDK.getWellKnownHostData();

			const etag = createHash('md5').update(JSON.stringify(responseData)).digest('hex');

			c.header('ETag', etag);
			c.header('Content-Type', 'application/json');

			return {
				body: responseData,
				statusCode: 200,
			};
		},
	);
};

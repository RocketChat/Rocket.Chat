import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

const ServerKeyResponseSchema = {
	type: 'object',
	properties: {
		old_verify_keys: {
			type: 'object',
			description: 'Old verification keys',
		},
		server_name: {
			type: 'string',
			description: 'Matrix server name',
		},
		signatures: {
			type: 'object',
			description: 'Server signatures',
		},
		valid_until_ts: {
			type: 'number',
			minimum: 0,
			description: 'Unix timestamp in milliseconds',
		},
		verify_keys: {
			type: 'object',
			description: 'Current verification keys',
		},
	},
	required: ['old_verify_keys', 'server_name', 'signatures', 'valid_until_ts', 'verify_keys'],
};

const isServerKeyResponseProps = ajv.compile(ServerKeyResponseSchema);

export const getKeyServerRoutes = (services: HomeserverServices) => {
	const { server } = services;

	return new Router('/key').get(
		'/v2/server',
		{
			response: {
				200: isServerKeyResponseProps,
			},
			tags: ['Key'],
			license: ['federation'],
		},
		async () => {
			const response = await server.getSignedServerKey();

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};

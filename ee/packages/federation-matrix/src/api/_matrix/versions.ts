import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

const GetVersionsResponseSchema = {
	type: 'object',
	properties: {
		server: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					description: 'Server software name',
				},
				version: {
					type: 'string',
					description: 'Server software version',
				},
			},
			required: ['name', 'version'],
		},
	},
	required: ['server'],
};

const isGetVersionsResponseProps = ajv.compile(GetVersionsResponseSchema);

export const getFederationVersionsRoutes = (services: HomeserverServices) => {
	const { config } = services;

	return new Router('/federation').get(
		'/v1/version',
		{
			response: {
				200: isGetVersionsResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async () => {
			const serverConfig = config.getServerConfig();

			const response = {
				server: {
					name: serverConfig.name,
					version: serverConfig.version,
				},
			};

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};

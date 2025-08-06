import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

export const getMatrixSendJoinRoutes = (services: HomeserverServices) => {
	const { sendJoin } = services;

	return new Router('/federation').put(
		'/v2/send_join/:roomId/:stateKey',
		{
			params: ajv.compile({type: 'object'}),
			body: ajv.compile({type: 'object'}),
			response: {
				200: ajv.compile({type: 'object'}),
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const { roomId, stateKey } = c.req.param();
			const body = await c.req.json();

			const response = await sendJoin.sendJoin(roomId, stateKey, body);

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};

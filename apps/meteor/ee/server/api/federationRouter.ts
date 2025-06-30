import { isRunningMs } from '../../../server/lib/isRunningMs';
import { FederationMatrix } from '@rocket.chat/core-services';
import { API } from '../../../app/api/server';

if (!isRunningMs()) {
	API.matrixInternal.get('/ping', { response: {} }, async function () {
		await FederationMatrix.ping();
		return {
			statusCode: 200,
			body: {
				message: 'pong',
				timestamp: new Date().toISOString(),
			},
		};
	});

	API.wellKnown.get('/matrix/server', { response: {} }, async function () {
		const response = await FederationMatrix.getWellKnownHostData();
		return {
			statusCode: 200,
			body: response,
		};
	});

	API._matrix.get('/federation/v1/query/profile', { response: {} }, async function (ctx) {
		const url = new URL(ctx.url);
		const userId = url.searchParams.get('user_id') || '';
		const response = await FederationMatrix.queryProfile(userId);

		return {
			statusCode: 200,
			body: response,
		};
	});
}

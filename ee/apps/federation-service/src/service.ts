import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { Hono } from 'hono';

import { config } from './config';

function handleHealthCheck(app: Hono) {
	app.get('/health', async (c) => {
		try {
			return c.json({ status: 'ok' });
		} catch (err) {
			console.error('Service not healthy', err);
			return c.json({ status: 'not healthy' }, 500);
		}
	});
}

(async () => {
	console.log('Starting federation-service on microservice mode');

	const { db } = await getConnection();
	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	const { FederationMatrix } = await import('@rocket.chat/federation-matrix');

	// TODO: In microservice mode, callbacks are not available as they're part of the Meteor app
	// Reaction hooks will only work in monolith mode
	const federationMatrix = await FederationMatrix.create();
	api.registerService(federationMatrix);

	const app = new Hono();
	const { matrix, wellKnown } = federationMatrix.getAllRoutes();

	app.mount('/_matrix', matrix.getHonoRouter().fetch);
	app.mount('/.well-known', wellKnown.getHonoRouter().fetch);

	handleHealthCheck(app);

	serve({
		fetch: app.fetch,
		port: config.port,
	});

	await api.start();
})();

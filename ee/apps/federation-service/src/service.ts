import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { api, getConnection, getTrashCollection, Settings } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { Hono } from 'hono';

import { config } from './config';

function handleHealthCheck(app: Hono) {
	app.get('/health', async (c) => {
		try {
			const hasLicense = await License.hasModule('federation');
			const isEnabled = await Settings.get('Federation_Service_Enabled');

			return c.json({
				status: 'ok',
				license: hasLicense ? 'valid' : 'invalid',
				settings: {
					federation_enabled: isEnabled,
				},
			});
		} catch (err) {
			console.error('Service not healthy', err);
			return c.json({ status: 'not healthy', error: (err as Error).message }, 500);
		}
	});
}

(async () => {
	console.log('Starting federation-service on microservice mode');

	const { db } = await getConnection();
	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	await api.start();

	const hasLicense = License.hasModule('federation');
	if (!hasLicense) {
		throw new Error('Service requires a valid Enterprise license with the federation module');
	}

	const isEnabled = await Settings.get('Federation_Service_Enabled');
	if (!isEnabled) {
		throw new Error('Service is disabled in settings (Federation_Service_Enabled = false)');
	}

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
})().catch((error) => {
	console.error('Failed to start service:', error);
	process.exit(1);
});

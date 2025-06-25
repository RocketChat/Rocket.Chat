import 'reflect-metadata';
import { api, getConnection, getTrashCollection } from '@rocket.chat/core-services';
import { registerServiceModels } from '@rocket.chat/models';
import { startBroker } from '@rocket.chat/network-broker';
import { Hono } from 'hono';
import { config } from './config';
import type { RouteDefinition, RouteContext } from '@rocket.chat/homeserver';
import { serve } from '@hono/node-server';

export function handleFederationRoutesRegistration(app: Hono, homeserverRoutes: RouteDefinition[]): Hono {
	console.info(`Registering ${homeserverRoutes.length} homeserver routes`);

	for (const route of homeserverRoutes) {
		const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
		
		app[method](route.path, async (c) => {
			try {
				const context = {
				req: c.req,
				res: c.res,
				params: c.req.param(),
				query: c.req.query(),
				body: await c.req.json().catch(() => ({})),
				};
				
				const result = await route.handler(context as unknown as RouteContext);
				
				return c.json(result);
			} catch (error) {
				console.error(`Error handling route ${method.toUpperCase()} ${route.path}:`, error);
				return c.json({ error: 'Internal server error' }, 500);
			}
		});
	}

	return app;
}
  
function handleHealthCheck(app: Hono) {
	app.get('/health', async (c) => {
		try {
		return c.json({ status: 'ok' });
		} catch (err) {
		console.error('Service not healthy', err);
		return c.json({ status: 'not healthy' }, 500);
		}
	})
}

(async () => {
	console.log('Starting federation-service on microservice mode');
	
	const { db } = await getConnection();
	registerServiceModels(db, await getTrashCollection());

	api.setBroker(startBroker());

	const { FederationMatrix } = await import('@rocket.chat/federation-matrix');
	const federationMatrix = new FederationMatrix();
	api.registerService(federationMatrix);

	const app = new Hono();
	handleFederationRoutesRegistration(app, federationMatrix.getAllRoutes());
	handleHealthCheck(app);

	serve({
		fetch: app.fetch,
		port: config.port,
	});	

	await api.start();
})();

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import polka from 'polka';
import { getAllRoutes, setupHomeserver, type HomeserverSetupOptions } from '@rocket.chat/homeserver';
import { config } from '../config';
import type { RouteContext } from '@rocket.chat/homeserver/packages/homeserver/src/types/route.types';

function handleFederationRoutesRegistration(app: Hono) {
  const homeserverRoutes = getAllRoutes();
  console.info(`Registering ${homeserverRoutes.length} homeserver routes`);

  for (const route of homeserverRoutes) {
    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
    const path = `${config.routePrefix}${route.path}`;
    
    app[method](path, async (c) => {
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
        console.error(`Error handling route ${method.toUpperCase()} ${path}:`, error);
        return c.json({ error: 'Internal server error' }, 500);
      }
    });
  }

  const federationServer = serve({
    fetch: app.fetch,
    port: config.port,
  });

  return federationServer;
}

function handleHealthCheck() {
  const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '4000');
    polka()
      .get('/health', async (_req, res) => {
        try {
          // TODO: Simple health check - could be extended to check dependencies
          res.end('ok');
        } catch (err) {
          console.error('Service not healthy', err);
          res.writeHead(500);
          res.end('not healthy');
        }
      })
      .listen(HEALTH_PORT, () => {
        console.info(`Health check listening on port ${HEALTH_PORT}`);
      });
}

export async function startMicroservice(options?: HomeserverSetupOptions) {
  try {
    await setupHomeserver(options);

    const app = new Hono();
    const federationServer = handleFederationRoutesRegistration(app);
    handleHealthCheck();
    
    console.info(`Federation service started on port ${config.port}`);
    console.info(`Routes available at ${config.routePrefix}/*`);
    
    const shutdown = () => {
      console.info('Shutting down gracefully...');
      federationServer.close(() => {
        console.info('Server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start microservice:', error);
    process.exit(1);
  }
}
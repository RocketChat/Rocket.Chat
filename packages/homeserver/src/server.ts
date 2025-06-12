import 'reflect-metadata';
import { createLogger } from './utils/logger';
import { homeserverModule } from './homeserver.module';

const logger = createLogger('HomeserverServer');

async function start() {
	try {
		// Set microservice mode
		process.env.HOMESERVER_MODE = 'microservice';
		
		// Load environment variables
		const port = parseInt(process.env.HOMESERVER_PORT || '8448', 10);
		const domain = process.env.HOMESERVER_DOMAIN || 'localhost';
		
		logger.info(`Starting Homeserver in microservice mode`);
		logger.info(`Domain: ${domain}`);
		logger.info(`Port: ${port}`);
		
		// Create and start the app
		await homeserverModule.createApp();
		await homeserverModule.start(port);
		
		logger.info(`🚀 Homeserver is running at http://${domain}:${port}`);
		logger.info(`Matrix federation endpoint: https://${domain}:${port}/_matrix/federation`);
		logger.info(`Well-known endpoint: https://${domain}:${port}/.well-known/matrix/server`);
		
		// Graceful shutdown
		process.on('SIGTERM', async () => {
			logger.info('SIGTERM received, shutting down gracefully...');
			process.exit(0);
		});
		
		process.on('SIGINT', async () => {
			logger.info('SIGINT received, shutting down gracefully...');
			process.exit(0);
		});
		
	} catch (error) {
		logger.error('Failed to start homeserver:', error);
		process.exit(1);
	}
}

// Start the server
start();
import type { HomeserverEvent } from '@rocket.chat/core-services';
import { FederationHomeserver } from '@rocket.chat/core-services';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../api';

// Define request/response schemas
const federationTransactionSchema = ajv.compile({
	type: 'object',
	properties: {
		events: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					type: { type: 'string' },
					id: { type: 'string' },
					timestamp: { type: 'number' },
					data: { type: 'object' },
				},
				required: ['type', 'id', 'timestamp', 'data'],
			},
		},
		origin: { type: 'string' },
		origin_server_ts: { type: 'number' },
	},
	required: ['events'],
});

const federationHealthResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		status: { type: 'string' },
		version: { type: 'string' },
	},
	required: ['status', 'version'],
});

// Health check endpoint (no auth required)
API.v1.get(
	'homeserver/health',
	{
		authRequired: false,
		response: {
			200: federationHealthResponseSchema,
		},
	},
	{
		async get() {
			const service = FederationHomeserver.getService();
			if (!service) {
				return {
					status: 'unavailable',
					version: '1.0.0',
				};
			}

			return {
				status: service.isEnabled() ? 'healthy' : 'disabled',
				version: '1.0.0',
			};
		},
	},
);

// Federation transaction endpoint
API.v1.post(
	'homeserver/federation/v1/send/:txnId',
	{
		authRequired: false, // We'll verify token manually
		bodyParams: federationTransactionSchema,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					txn_id: { type: 'string' },
					results: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								event_id: { type: 'string' },
								status: { type: 'string' },
								error: { type: 'string' },
							},
							required: ['event_id', 'status'],
						},
					},
				},
				required: ['txn_id', 'results'],
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					error: { type: 'string' },
				},
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					error: { type: 'string' },
				},
			}),
		},
	},
	{
		async post() {
			const service = FederationHomeserver.getService();
			if (!service) {
				return API.v1.failure('Service unavailable');
			}

			// Verify homeserver token
			const authHeader = this.request.headers.authorization;
			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return API.v1.unauthorized({ error: 'Missing or invalid authorization header' });
			}

			const token = authHeader.substring(7);
			const config = service.getConfig();
			if (token !== config.homeserverToken) {
				return API.v1.forbidden({ error: 'Invalid homeserver token' });
			}

			const txnId = this.urlParams.txnId;
			const transaction = this.bodyParams;

			console.log(`[HomeserverFederation] Received transaction ${txnId} from ${transaction.origin}`);

			// Process each event
			const results = [];
			for (const event of transaction.events) {
				try {
					// Send event to service for processing
					await service.processIncomingEvent(event as HomeserverEvent);
					results.push({ event_id: event.id, status: 'success' });
				} catch (error) {
					console.error(`[HomeserverFederation] Failed to process event ${event.id}:`, error);
					results.push({ event_id: event.id, status: 'error', error: error.message });
				}
			}

			return {
				txn_id: txnId,
				results,
			};
		},
	},
);

// Get user profile endpoint
API.v1.get(
	'homeserver/federation/v1/user/:userId',
	{
		authRequired: false, // We'll verify token manually
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					user_id: { type: 'string' },
					displayname: { type: 'string' },
					avatar_url: { type: ['string', 'null'] },
				},
				required: ['user_id'],
			}),
			404: ajv.compile({
				type: 'object',
				properties: {
					error: { type: 'string' },
				},
			}),
		},
	},
	{
		async get() {
			const service = FederationHomeserver.getService();
			if (!service) {
				return API.v1.failure('Service unavailable');
			}

			// Verify homeserver token
			const authHeader = this.request.headers.authorization;
			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return API.v1.unauthorized({ error: 'Missing or invalid authorization header' });
			}

			const token = authHeader.substring(7);
			const config = service.getConfig();
			if (token !== config.homeserverToken) {
				return API.v1.forbidden({ error: 'Invalid homeserver token' });
			}

			const userId = this.urlParams.userId;
			
			// TODO: Implement user profile fetching
			// For now, return a placeholder
			return {
				user_id: userId,
				displayname: userId.split(':')[0].substring(1),
				avatar_url: null,
			};
		},
	},
);

// Export function to initialize routes
export function initializeHomeserverFederationRoutes(): void {
	console.log('[HomeserverFederation] API routes initialized');
}
import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

const SendTransactionParamsSchema = {
	type: 'object',
	properties: {
		txnId: {
			type: 'string',
			description: 'Transaction ID',
		},
	},
	required: ['txnId'],
};

const isSendTransactionParamsProps = ajv.compile(SendTransactionParamsSchema);

const EventHashSchema = {
	type: 'object',
	properties: {
		sha256: {
			type: 'string',
			description: 'SHA256 hash of the event',
		},
	},
	required: ['sha256'],
};

const EventSignatureSchema = {
	type: 'object',
	description: 'Event signatures by server and key ID',
};

const EventBaseSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			description: 'Event type',
		},
		content: {
			type: 'object',
			description: 'Event content',
		},
		sender: {
			type: 'string',
			pattern: '^@[A-Za-z0-9_=\\/.+-]+:(.+)$',
			description: 'Matrix user ID in format @user:server.com',
		},
		room_id: {
			type: 'string',
			pattern: '^![A-Za-z0-9_=\\/.+-]+:(.+)$',
			description: 'Matrix room ID in format !room:server.com',
		},
		origin_server_ts: {
			type: 'number',
			minimum: 0,
			description: 'Unix timestamp in milliseconds',
		},
		depth: {
			type: 'number',
			minimum: 0,
			description: 'Event depth',
		},
		prev_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Previous events in the room',
		},
		auth_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Authorization events',
		},
		origin: {
			type: 'string',
			description: 'Origin server',
		},
		hashes: {
			...EventHashSchema,
			nullable: true,
		},
		signatures: {
			...EventSignatureSchema,
			nullable: true,
		},
		unsigned: {
			type: 'object',
			description: 'Unsigned data',
			nullable: true,
		},
	},
	required: ['type', 'content', 'sender', 'room_id', 'origin_server_ts', 'depth', 'prev_events', 'auth_events', 'origin'],
};

const SendTransactionBodySchema = {
	type: 'object',
	properties: {
		pdus: {
			type: 'array',
			items: EventBaseSchema,
			description: 'Persistent data units (PDUs) to process',
			default: [],
		},
		edus: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
			description: 'Ephemeral data units (EDUs)',
			default: [],
			nullable: true,
		},
	},
	required: ['pdus'],
};

const isSendTransactionBodyProps = ajv.compile(SendTransactionBodySchema);

const SendTransactionResponseSchema = {
	type: 'object',
	properties: {
		pdus: {
			type: 'object',
			description: 'Processing results for each PDU',
		},
		edus: {
			type: 'object',
			description: 'Processing results for each EDU',
		},
	},
	required: ['pdus', 'edus'],
};

const isSendTransactionResponseProps = ajv.compile(SendTransactionResponseSchema);

const ErrorResponseSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'string',
		},
		details: {
			type: 'object',
		},
	},
	required: ['error', 'details'],
};

const isErrorResponseProps = ajv.compile(ErrorResponseSchema);

export const getMatrixTransactionsRoutes = (services: HomeserverServices) => {
	const { event } = services;

	return new Router('/federation').put(
		'/v1/send/:txnId',
		{
			params: isSendTransactionParamsProps,
			body: isSendTransactionBodyProps,
			response: {
				200: isSendTransactionResponseProps,
				400: isErrorResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const body = await c.req.json();

			const { pdus = [] } = body;

			if (pdus.length === 0) {
				return {
					body: {
						pdus: {},
						edus: {},
					},
					statusCode: 200,
				};
			}

			await event.processIncomingPDUs(pdus);

			return {
				body: {
					pdus: {},
					edus: {},
				},
				statusCode: 200,
			};
		},
	);
};

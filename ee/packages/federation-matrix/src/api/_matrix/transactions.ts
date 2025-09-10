import type { HomeserverServices } from '@hs/federation-sdk';
import type { EventID } from '@hs/room';
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

const GetEventParamsSchema = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: 'Event ID',
		},
	},
	required: ['eventId'],
	additionalProperties: false,
};

const isGetEventParamsProps = ajv.compile(GetEventParamsSchema);

const GetEventResponseSchema = {
	type: 'object',
	properties: {
		origin_server_ts: {
			type: 'number',
			minimum: 0,
			description: 'Unix timestamp in milliseconds',
		},
		origin: {
			type: 'string',
			description: 'Origin server',
		},
		pdus: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Persistent data units (PDUs)',
		},
	},
	required: ['origin_server_ts', 'origin', 'pdus'],
};

const isGetEventResponseProps = ajv.compile(GetEventResponseSchema);

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
	required: ['type', 'content', 'sender', 'room_id', 'origin_server_ts', 'depth', 'prev_events', 'auth_events'],
};

const SendTransactionBodySchema = {
	type: 'object',
	properties: {
		origin: {
			type: 'string',
			description: 'Origin server',
		},
		origin_server_ts: {
			type: 'number',
			minimum: 0,
			description: 'Unix timestamp in milliseconds',
		},
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
	required: ['origin', 'origin_server_ts', 'pdus'],
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

const GetStateIdsParamsSchema = {
	type: 'object',
	properties: {
		event_id: {
			type: 'string',
		},
	},
	required: ['event_id'],
};

const isGetStateIdsParamsProps = ajv.compile(GetStateIdsParamsSchema);

const GetStateIdsResponseSchema = {
	type: 'object',
	properties: {
		stateIds: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
};

const isGetStateIdsResponseProps = ajv.compile(GetStateIdsResponseSchema);
const GetStateParamsSchema = {
	type: 'object',
	properties: {
		event_id: {
			type: 'string',
		},
	},
};
const isGetStateParamsProps = ajv.compile<{
	event_id: string;
}>(GetStateParamsSchema);

const GetStateResponseSchema = {
	type: 'object',
	properties: {
		state: {
			type: 'object',
		},
	},
};

const isGetStateResponseProps = ajv.compile(GetStateResponseSchema);

export const getMatrixTransactionsRoutes = (services: HomeserverServices) => {
	const { event, config } = services;

	// PUT /_matrix/federation/v1/send/{txnId}
	return (
		new Router('/federation')
			.put(
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

					try {
						await event.processIncomingTransaction(body);
					} catch (error: any) {
						// TODO custom error types?
						if (error.message === 'too-many-concurrent-transactions') {
							return {
								statusCode: 429,
								body: {
									errorcode: 'M_UNKNOWN',
									error: 'Too many concurrent transactions',
								},
							};
						}

						return {
							statusCode: 400,
							body: {},
						};
					}

					return {
						body: {
							pdus: {},
							edus: {},
						},
						statusCode: 200,
					};
				},
			)

			// GET /_matrix/federation/v1/state_ids/{roomId}

			.get(
				'/v1/state_ids/:roomId',
				{
					params: isGetStateIdsParamsProps,
					response: {
						200: isGetStateIdsResponseProps,
					},
				},
				async (c) => {
					const roomId = c.req.param('roomId');
					const eventId = c.req.query('event_id');

					if (!eventId) {
						return {
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Event not found',
							},
							statusCode: 404,
						};
					}

					const stateIds = await event.getStateIds(roomId, eventId as EventID);

					return {
						body: stateIds,
						statusCode: 200,
					};
				},
			)
			.get(
				'/v1/state/:roomId',
				{
					params: isGetStateParamsProps,
					response: {
						200: isGetStateResponseProps,
					},
				},
				async (c) => {
					const roomId = c.req.param('roomId');
					const eventId = c.req.query('event_id');

					if (!eventId) {
						return {
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Event not found',
							},
							statusCode: 404,
						};
					}
					const state = await event.getState(roomId, eventId as EventID);
					return {
						statusCode: 200,
						body: state,
					};
				},
			)
			// GET /_matrix/federation/v1/event/{eventId}
			.get(
				'/v1/event/:eventId',
				{
					params: isGetEventParamsProps,
					response: {
						200: isGetEventResponseProps,
					},
					tags: ['Federation'],
					license: ['federation'],
				},
				async (c) => {
					const eventData = await event.getEventById(c.req.param('eventId') as EventID);
					if (!eventData) {
						return {
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Event not found',
							},
							statusCode: 404,
						};
					}

					return {
						body: {
							origin_server_ts: eventData.event.origin_server_ts,
							origin: config.serverName,
							pdus: [eventData.event],
						},
						statusCode: 200,
					};
				},
			)
	);
};

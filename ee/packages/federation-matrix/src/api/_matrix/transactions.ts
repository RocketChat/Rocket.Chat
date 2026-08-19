import type { EventID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import { logger } from '../logger';
import { canAccessResourceMiddleware } from '../middlewares/canAccessResource';
import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

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
			items: {
				// deliberately unconstrained, matching the spec: the PDU format varies by room
				// version, and a malformed PDU must be reported per-PDU in the 200 response's
				// `pdus` map instead of failing the whole transaction with a 400
				type: 'object',
			},
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
	},
	required: ['pdus'],
};

const isSendTransactionResponseProps = ajv.compile(SendTransactionResponseSchema);

const ErrorResponseSchema = {
	type: 'object',
	properties: {
		errcode: {
			type: 'string',
		},
		error: {
			type: 'string',
		},
	},
	required: ['errcode', 'error'],
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
		auth_chain_ids: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Auth chain event IDs, recursively',
		},
		pdu_ids: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Event IDs of the fully resolved room state at the given event',
		},
	},
	required: ['auth_chain_ids', 'pdu_ids'],
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
		auth_chain: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Auth chain events, recursively',
		},
		pdus: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'The fully resolved room state at the given event',
		},
	},
	required: ['auth_chain', 'pdus'],
};

const isGetStateResponseProps = ajv.compile(GetStateResponseSchema);

const BackfillParamsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			pattern: '^![A-Za-z0-9_=\\/.+-]+:(.+)$',
			description: 'Matrix room ID',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

const isBackfillParamsProps = ajv.compile(BackfillParamsSchema);

const BackfillQuerySchema = {
	type: 'object',
	properties: {
		limit: {
			// unbounded above per spec; the handler caps it. Synapse rejects 0 and negatives
			type: 'integer',
			minimum: 1,
			description: 'Maximum number of events to retrieve',
		},
		v: {
			// a string branch here would be redundant: ajvQuery coerces a single `?v=` into a
			// one-element array, and in a `oneOf` both branches would match and fail validation
			type: 'array',
			items: { type: 'string' },
			description: 'Event ID(s) to backfill from',
		},
	},
	required: ['limit', 'v'],
};

const isBackfillQueryProps = ajvQuery.compile<{
	limit: number;
	v: string[];
}>(BackfillQuerySchema);

const BackfillResponseSchema = {
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
			items: {
				// spec: backfill responses "MUST NOT be validated" against PDU restrictions
				type: 'object',
			},
			description: 'Events in reverse chronological order',
		},
	},
	required: ['origin', 'origin_server_ts', 'pdus'],
};

const isBackfillResponseProps = ajv.compile(BackfillResponseSchema);

export const getMatrixTransactionsRoutes = () => {
	return (
		new Router('/federation')
			.use(isAuthenticatedMiddleware())
			// https://spec.matrix.org/v1.19/server-server-api/#put_matrixfederationv1sendtxnid
			.put(
				'/v1/send/:txnId',
				{
					params: isSendTransactionParamsProps,
					body: isSendTransactionBodyProps,
					response: {
						200: isSendTransactionResponseProps,
						400: isErrorResponseProps,
						429: isErrorResponseProps,
						500: isErrorResponseProps,
					},
					tags: ['Federation'],
					license: ['federation'],
				},
				async (c) => {
					const body = await c.req.json();

					try {
						await federationSDK.processIncomingTransaction(body);
					} catch (error: any) {
						// TODO custom error types?
						if (error.message === 'too-many-concurrent-transactions') {
							return {
								statusCode: 429,
								body: {
									errcode: 'M_UNKNOWN',
									error: 'Too many concurrent transactions',
								},
							};
						}

						if (error.message === 'too-many-events') {
							return {
								statusCode: 400,
								body: {
									errcode: 'M_UNKNOWN',
									error: 'Too many PDUs or EDUs',
								},
							};
						}

						// a 200 tells the origin the transaction was delivered and it will never resend
						// these PDUs. Per-PDU failures are already handled by the SDK, so anything
						// reaching here is a server-side failure and must be retryable - Synapse only
						// backs off and redelivers on 5xx
						logger.error({ msg: 'Error processing incoming transaction', err: error });

						return {
							statusCode: 500,
							body: {
								errcode: 'M_UNKNOWN',
								error: 'Failed to process transaction',
							},
						};
					}

					return {
						body: {
							pdus: {},
						},
						statusCode: 200,
					};
				},
			)

			// https://spec.matrix.org/v1.19/server-server-api/#get_matrixfederationv1state_idsroomid
			.get(
				'/v1/state_ids/:roomId',
				{
					params: isGetStateIdsParamsProps,
					response: {
						200: isGetStateIdsResponseProps,
					},
				},
				canAccessResourceMiddleware('room'),
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

					const stateIds = await federationSDK.getStateIds(roomId, eventId as EventID);

					return {
						body: stateIds,
						statusCode: 200,
					};
				},
			)
			// https://spec.matrix.org/v1.19/server-server-api/#get_matrixfederationv1stateroomid
			.get(
				'/v1/state/:roomId',
				{
					params: isGetStateParamsProps,
					response: {
						200: isGetStateResponseProps,
					},
				},
				canAccessResourceMiddleware('room'),
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
					const state = await federationSDK.getState(roomId, eventId as EventID);
					return {
						statusCode: 200,
						body: state,
					};
				},
			)
			// https://spec.matrix.org/v1.19/server-server-api/#get_matrixfederationv1eventeventid
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
				canAccessResourceMiddleware('event'),
				async (c) => {
					const eventData = await federationSDK.getEventById(c.req.param('eventId') as EventID);
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
							origin: eventData.origin,
							pdus: [eventData.event],
						},
						statusCode: 200,
					};
				},
			)
			// https://spec.matrix.org/v1.19/server-server-api/#get_matrixfederationv1backfillroomid
			.get(
				'/v1/backfill/:roomId',
				{
					params: isBackfillParamsProps,
					query: isBackfillQueryProps,
					response: {
						200: isBackfillResponseProps,
					},
					tags: ['Federation'],
					license: ['federation'],
				},
				canAccessResourceMiddleware('room'),
				async (c) => {
					const roomId = c.req.param('roomId');
					const limit = Math.min(Number(c.req.query('limit') || 100), 100);

					// this will be handled by the federation-sdk on next versions so this can be removed
					if (limit < 1) {
						return {
							body: {
								origin: federationSDK.getConfig('serverName'),
								origin_server_ts: Date.now(),
								pdus: [],
							},
							statusCode: 200,
						};
					}

					const eventIds = c.req.queries('v');
					if (!eventIds?.length) {
						return {
							body: {
								errcode: 'M_BAD_REQUEST',
								error: 'Event ID must be provided in v query parameter',
							},
							statusCode: 400,
						};
					}

					try {
						const result = await federationSDK.getBackfillEvents(roomId, eventIds as EventID[], limit);

						return {
							body: result,
							statusCode: 200,
						};
					} catch (error) {
						return {
							body: {
								errcode: 'M_UNKNOWN',
								error: 'Failed to get backfill events',
							},
							statusCode: 500,
						};
					}
				},
			)
	);
};

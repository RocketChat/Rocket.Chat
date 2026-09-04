import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

const errorPair = {
	type: 'object',
	properties: {
		code: { type: 'string' },
		message: { type: 'string' },
	},
	required: ['code', 'message'],
	additionalProperties: false,
};

export const POSTCalendarSyncTestConnectionBodySchema = ajv.compile<{ probeMailbox?: string }>({
	type: 'object',
	properties: {
		probeMailbox: { type: 'string', minLength: 3, maxLength: 320 },
	},
	additionalProperties: false,
});

export const POSTCalendarSyncTestConnectionResponseSchema = ajv.compile<{
	connection: { ok: boolean; error?: { code: string; message: string } };
}>({
	type: 'object',
	properties: {
		connection: {
			type: 'object',
			properties: {
				ok: { type: 'boolean' },
				error: errorPair,
			},
			required: ['ok'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['connection', 'success'],
	additionalProperties: false,
});

export const POSTCalendarSyncRunResponseSchema = ajv.compile<{ started: boolean }>({
	type: 'object',
	properties: {
		started: { type: 'boolean' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['started', 'success'],
	additionalProperties: false,
});

const runSummary = {
	type: 'object',
	properties: {
		startedAt: { type: 'string' },
		durationMs: { type: 'number' },
		usersProcessed: { type: 'number' },
		usersSkippedNoMailbox: { type: 'number' },
		usersFailed: { type: 'number' },
		eventsUpserted: { type: 'number' },
		eventsDeleted: { type: 'number' },
	},
	required: ['startedAt', 'durationMs', 'usersProcessed', 'usersSkippedNoMailbox', 'usersFailed', 'eventsUpserted', 'eventsDeleted'],
	additionalProperties: false,
};

export const GETCalendarSyncStatusResponseSchema = ajv.compile<{
	lastRun: unknown;
	states: { total: number; failing: number };
}>({
	type: 'object',
	properties: {
		lastRun: { anyOf: [runSummary, { type: 'null' }] },
		states: {
			type: 'object',
			properties: {
				total: { type: 'number' },
				failing: { type: 'number' },
			},
			required: ['total', 'failing'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['lastRun', 'states', 'success'],
	additionalProperties: false,
});

export const GETCalendarSyncUserStatusQuerySchema = ajvQuery.compile<{ userId: string }>({
	type: 'object',
	properties: {
		userId: { type: 'string', minLength: 1 },
	},
	required: ['userId'],
	additionalProperties: false,
});

const userSyncState = {
	type: 'object',
	properties: {
		uid: { type: 'string' },
		mailbox: { type: 'string' },
		provider: { type: 'string', enum: ['microsoft-graph', 'exchange-ews'] },
		lastSyncAt: { type: 'string' },
		lastSuccessAt: { type: 'string' },
		consecutiveFailures: { type: 'number' },
		lastError: {
			type: 'object',
			properties: {
				code: { type: 'string' },
				message: { type: 'string' },
				at: { type: 'string' },
			},
			required: ['code', 'message'],
			additionalProperties: false,
		},
	},
	required: ['uid', 'mailbox', 'provider'],
	additionalProperties: false,
};

export const GETCalendarSyncUserStatusResponseSchema = ajv.compile<{ state: unknown }>({
	type: 'object',
	properties: {
		state: { anyOf: [userSyncState, { type: 'null' }] },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['state', 'success'],
	additionalProperties: false,
});

export const GETCalendarSyncWebhookQuerySchema = ajvQuery.compile<{ validationToken?: string }>({
	type: 'object',
	properties: {
		validationToken: { type: 'string' },
	},
	additionalProperties: true,
});

/**
 * Both webhook responses are plain text: the validation handshake echoes the token,
 * notification deliveries get an empty 202 (Graph only checks the status code).
 */
export const CalendarSyncWebhookValidationResponseSchema = ajv.compile<string>({ type: 'string' });

export const CalendarSyncWebhookAcceptedResponseSchema = ajv.compile<string>({ type: 'string' });

export const CalendarSyncGenericErrorSchema = ajv.compile<{ success: boolean; error?: string }>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		error: { type: 'string' },
		errorType: { type: 'string' },
	},
	required: ['success'],
	additionalProperties: true,
});

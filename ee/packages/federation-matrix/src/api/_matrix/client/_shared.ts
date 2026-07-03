import type { Router } from '@rocket.chat/http-router';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import { logger } from '../../logger';

export type ClientRouter = Router<'/client', any>;

// Logs an error and returns the matching Matrix 500 response. Use inside handler-local
// catch blocks that swallow the error. The same message is used for both the log and
// the response body, avoiding duplication.
export const internalError = (msg: string, err?: unknown, context?: Record<string, unknown>) => {
	logger.error({ msg, err, ...context });
	return {
		statusCode: 500 as const,
		body: { errcode: 'M_UNKNOWN', error: msg },
	};
};

// The federation SDK throws an Error with name 'UnknownRoomError' (message `Room <id> does not exist`)
// when a room isn't known to this homeserver. The class isn't exported for `instanceof`, so we match on
// `.name` — the same check the SDK uses internally.
export const isUnknownRoomError = (err: unknown): err is Error => err instanceof Error && err.name === 'UnknownRoomError';

// Matrix response for a room this homeserver doesn't know about. Mirrors Synapse: it must be a 4xx (never
// 5xx) so bridges like matrix-bifrost treat it as terminal and stop retrying, instead of hammering the
// endpoint every 100ms as if it were a transient server fault.
export const roomNotFound = () =>
	({
		statusCode: 403 as const,
		body: {
			errcode: 'M_FORBIDDEN',
			error: "You aren't a member of the room and weren't previously a member of the room.",
		},
	}) as const;

// Logs a warning and returns the matching Matrix 501 response. Use for endpoints/branches
// that are deliberately not implemented yet, so hits on those paths stay visible in the logs.
export const notImplemented = (msg: string, context?: Record<string, unknown>) => {
	logger.warn({ msg, ...context });
	return {
		statusCode: 501 as const,
		body: { errcode: 'M_UNRECOGNIZED', error: msg },
	};
};

export const tags = ['Federation'];
export const license: ['federation'] = ['federation'];

export const MATRIX_USER_ID_PATTERN = '^@[A-Za-z0-9_=\\/.+-]+:(.+)$';
export const MATRIX_ROOM_ID_PATTERN = '^![A-Za-z0-9_=\\/.+-]+:(.+)$';

const MatrixErrorSchema = {
	type: 'object',
	properties: {
		errcode: { type: 'string' },
		error: { type: 'string' },
	},
	required: ['errcode', 'error'],
};

export const isMatrixErrorProps = ajv.compile(MatrixErrorSchema);

// Matches only the literal `{}` these endpoints return per spec.
const EmptyObjectResponseSchema = {
	type: 'object',
	additionalProperties: false,
};

export const isEmptyObjectResponseProps = ajv.compile(EmptyObjectResponseSchema);

const ImpersonationQuerySchema = {
	type: 'object',
	properties: {
		user_id: {
			type: 'string',
			pattern: MATRIX_USER_ID_PATTERN,
			description: 'Matrix user ID to impersonate; must be in the AS user namespace',
		},
	},
	required: [],
};

export const isImpersonationQueryProps = ajvQuery.compile<{ user_id?: string }>(ImpersonationQuerySchema);

const RoomIdParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
	},
	required: ['roomId'],
};

export const isRoomIdParamsProps = ajv.compile(RoomIdParamsSchema);

const UserIdParamsSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
	},
	required: ['userId'],
};

export const isUserIdParamsProps = ajv.compile(UserIdParamsSchema);

const ProfileFieldParamsSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
		field: { type: 'string' },
	},
	required: ['userId', 'field'],
};

export const isProfileFieldParamsProps = ajv.compile(ProfileFieldParamsSchema);

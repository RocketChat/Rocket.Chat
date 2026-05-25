import type { Router } from '@rocket.chat/http-router';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

export type ClientRouter = Router<'/client', any>;

// TODO: remove before merge — diagnostic catch-all logger for AS bridge integration
export const catchAllClient = () =>
	createMiddleware(async (c: Context, next) => {
		try {
			const { method } = c.req;
			const url = new URL(c.req.url);
			const path = url.pathname + url.search;

			console.log(`Received request: ${method} ${path}`, c.req.header());

			return next();
		} catch (error) {
			return c.json({ error: 'Internal Server Error' }, 500);
		}
	});

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

const EmptyObjectResponseSchema = {
	type: 'object',
	additionalProperties: true,
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

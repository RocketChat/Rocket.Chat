import type { JsonRpc } from 'jsonrpc-lite';

import type { COMMAND_PING } from './LivenessManager';
import { AppPermissionManager } from '../../managers/AppPermissionManager';
import { AppPermissions } from '../../permissions/AppPermissions';

export type OutboundFrame = JsonRpc | typeof COMMAND_PING;

export type OutboundMiddleware = (frame: OutboundFrame, ctx: { appId: string }) => OutboundFrame;

const ABAC_ATTRIBUTES_KEY = 'abacAttributes';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (value === null || typeof value !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

const stripKeyDeep = (value: unknown, key: string): unknown => {
	if (Array.isArray(value)) {
		return value.map((item) => stripKeyDeep(item, key));
	}

	if (!isPlainObject(value)) {
		return value;
	}

	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value)) {
		if (k === key) {
			continue;
		}
		out[k] = stripKeyDeep(v, key);
	}
	return out;
};

export const stripAbacAttributes: OutboundMiddleware = (frame, { appId }) => {
	if (typeof frame === 'string') {
		return frame;
	}

	if (AppPermissionManager.hasPermission(appId, AppPermissions.abac.readAttributes)) {
		return frame;
	}

	return stripKeyDeep(frame, ABAC_ATTRIBUTES_KEY) as OutboundFrame;
};

export const applyOutboundMiddlewares = (middlewares: OutboundMiddleware[], frame: OutboundFrame, ctx: { appId: string }): OutboundFrame =>
	middlewares.reduce((current, middleware) => middleware(current, ctx), frame);

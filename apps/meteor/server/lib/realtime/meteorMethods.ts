import { ClientSafeError, isClientSafeError } from '@rocket.chat/core-services';
import type { RemoteMethodCall } from '@rocket.chat/ddp-server';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { getMeteorConnection } from './meteorConnection';
import { createMeteorInvocation } from '../utils/createMeteorInvocation';

// accounts-base still throws Meteor.Error, which the DDP server would otherwise hide behind a generic 500
const toClientSafeError = (err: unknown): unknown => {
	if (err instanceof ClientSafeError || !isClientSafeError(err)) {
		return err;
	}
	return new ClientSafeError(err.error, err.reason, err.details);
};

/**
 * Runs a method registered with Meteor as the session's user, subject to the same DDP rate limits.
 */
export const callMeteorMethod: RemoteMethodCall = async (session, method, params) => {
	const connection = getMeteorConnection(session);

	const rateLimiterInput = {
		userId: session.userId,
		clientAddress: connection.clientAddress,
		type: 'method' as const,
		name: method,
		connectionId: connection.id,
	};
	DDPRateLimiter._increment(rateLimiterInput);
	const rateLimitResult = DDPRateLimiter._check(rateLimiterInput);
	if (!rateLimitResult.allowed) {
		throw new ClientSafeError('too-many-requests', DDPRateLimiter.getErrorMessage(rateLimitResult), {
			timeToReset: rateLimitResult.timeToReset,
		});
	}

	const { applyInvocation } = createMeteorInvocation(connection, session.userId, session.userToken);
	try {
		return await applyInvocation((): Promise<unknown> => Meteor.callAsync(method, ...params));
	} catch (err) {
		throw toClientSafeError(err);
	}
};

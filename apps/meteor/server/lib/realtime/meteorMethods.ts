import { ClientSafeError, isClientSafeError } from '@rocket.chat/core-services';
import type { RemoteMethodCall } from '@rocket.chat/ddp-server';
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
 * Runs a method registered with Meteor as the session's user.
 */
export const callMeteorMethod: RemoteMethodCall = async (session, method, params) => {
	const connection = getMeteorConnection(session);
	const { applyInvocation } = createMeteorInvocation(connection, session.userId, session.userToken);
	try {
		return await applyInvocation((): Promise<unknown> => Meteor.callAsync(method, ...params));
	} catch (err) {
		throw toClientSafeError(err);
	}
};

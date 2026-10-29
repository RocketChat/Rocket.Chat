import { Server, encodeAdded, registerAutoupdatePublication, registerLoginServiceConfigurationPublication } from '@rocket.chat/ddp-server';
import { Users } from '@rocket.chat/models';

import { registerAccountMethods } from './accountMethods';
import { announceConnection } from './meteorConnection';
import { callMeteorMethod } from './meteorMethods';
import { lifecycle } from './sessions';
import { checkDdpRateLimit } from '../utils/checkDdpRateLimit';
import { getBaseUserFields } from '../utils/functions/getBaseUserFields';

/**
 * The DDP server behind this process's websocket. Methods it doesn't implement run through Meteor's method registry,
 * and every method call and subscription counts against the DDP rate limits.
 */
export const ddpServer = new Server(callMeteorMethod, (session, type, name) =>
	checkDdpRateLimit({
		userId: session.userId,
		clientAddress: session.connection.clientAddress ?? '',
		type,
		name,
		connectionId: session.connection.id,
	}),
);

export const meteorCollections = {
	loginServices: registerLoginServiceConfigurationPublication(ddpServer),
	clientVersions: registerAutoupdatePublication(ddpServer),
};

registerAccountMethods(ddpServer, lifecycle);

lifecycle.on('connected', announceConnection);

// stands in for Meteor's default publication, which sends a client its own user once it logs in
lifecycle.on('loggedIn', async (session) => {
	const { userId } = session;
	if (!userId) {
		return;
	}
	const user = await Users.findOneById(userId, { projection: getBaseUserFields(true) });
	if (!user) {
		return;
	}
	// after the login result, which is already queued
	setImmediate(() => session.send(encodeAdded('users', userId, user)));
});

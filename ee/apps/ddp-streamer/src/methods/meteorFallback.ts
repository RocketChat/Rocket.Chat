import { MeteorService } from '@rocket.chat/core-services';

import type { RemoteMethodCall } from '../ddp/Server';

/** Runs a method this process does not implement on the Meteor service, as the connected user. */
export const callMeteorMethod: RemoteMethodCall = async (session, method, params) => {
	const { result } = await MeteorService.callMethodWithToken(session.userId, session.userToken, method, params);
	return result;
};

import { MeteorService } from '@rocket.chat/core-services';

import type { RemoteMethodCall } from '../ddp/Server';

/** Runs a method this process does not implement on the Meteor service, as the connected user. */
export const callMeteorMethod: RemoteMethodCall = async (client, method, params) => {
	const { result } = await MeteorService.callMethodWithToken(client.userId, client.userToken, method, params);
	return result;
};

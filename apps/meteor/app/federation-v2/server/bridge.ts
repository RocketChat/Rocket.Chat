import { Bridge, AppServiceRegistration } from 'matrix-appservice-bridge';

import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { addToQueue } from './queue';
import { config } from './config';

/* eslint-disable @typescript-eslint/camelcase */
const registrationConfig = AppServiceRegistration.fromObject({
	id: config.id,
	hs_token: config.hsToken,
	as_token: config.asToken,
	url: config.bridgeUrl,
	sender_localpart: config.bridgeLocalpart,
	namespaces: {
		users: [
			{
				exclusive: false,
				// Reserve these MXID's (usernames)
				regex: `.*`,
			},
		],
		aliases: [
			{
				exclusive: false,
				// Reserve these room aliases
				regex: `.*`,
			},
		],
		rooms: [
			{
				exclusive: false,
				// This regex is used to define which rooms we listen to with the bridge.
				// This does not reserve the rooms like the other namespaces.
				regex: '.*',
			},
		],
	},
	rate_limited: false,
	protocols: null,
});
/* eslint-enable @typescript-eslint/camelcase */

export const matrixBridge = new Bridge({
	homeserverUrl: config.homeserverUrl,
	domain: config.homeserverDomain,
	registration: registrationConfig,
	disableStores: true,
	controller: {
		onAliasQuery: (alias, matrixRoomId): void => {
			console.log('onAliasQuery', alias, matrixRoomId);
		},
		onEvent: async (request /* , context*/): Promise<void> => {
			// Get the event
			const event = request.getData() as unknown as IMatrixEvent<MatrixEventType>;

			addToQueue(event);
		},
		onLog: async (line, isError): Promise<void> => {
			console.log(line, isError);
		},
	},
});

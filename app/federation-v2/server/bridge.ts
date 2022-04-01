import { Bridge, AppServiceRegistration } from 'matrix-appservice-bridge';

import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { addToQueue } from './queue';
import { isFederationV2Enabled } from './tools';
import { settings } from '../../settings/server';

let bridge;

((): void => {
	if (!isFederationV2Enabled()) return;

	/* eslint-disable @typescript-eslint/camelcase */
	const registrationConfig = AppServiceRegistration.fromObject({
		id: settings.get('FederationV2_id') as string,
		hs_token: settings.get('FederationV2_hs_token') as string,
		as_token: settings.get('FederationV2_as_token') as string,
		url: settings.get('FederationV2_bridge_url') as string,
		sender_localpart: settings.get('FederationV2_bridge_localpart') as string,
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

	bridge = new Bridge({
		homeserverUrl: settings.get('FederationV2_homeserver_url') as string,
		domain: settings.get('FederationV2_homeserver_domain') as string,
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
})();

export const matrixBridge = bridge;

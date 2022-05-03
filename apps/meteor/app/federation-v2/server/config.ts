import type { AppServiceOutput } from '@rocket.chat/forked-matrix-appservice-bridge';

import { settings } from '../../settings/server';

export type bridgeUrlTuple = [string, string, number];

export function getRegistrationInfo(): AppServiceOutput {
	/* eslint-disable @typescript-eslint/camelcase */
	return {
		id: settings.get('Federation_Matrix_id'),
		hs_token: settings.get('Federation_Matrix_hs_token'),
		as_token: settings.get('Federation_Matrix_as_token'),
		url: settings.get<string>('Federation_Matrix_bridge_url'),
		sender_localpart: settings.get('Federation_Matrix_bridge_localpart'),
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
	};
	/* eslint-enable @typescript-eslint/camelcase */
}

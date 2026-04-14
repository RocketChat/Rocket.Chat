import type { IRoom } from '@rocket.chat/core-typings';

import { credentials, methodCall, request } from './api-data';
import type { IRequestConfig } from './users.helper';

type SendMessageParams = {
	rid: IRoom['_id'];
	msg: string;
	config?: IRequestConfig;
};

/**
 * Sends a text message to a room using the method.call/sendMessage DDP endpoint.
 *
 * This helper function allows sending messages to rooms (channels, groups, DMs)
 * for federation testing scenarios using the DDP method format. It supports
 * custom request configurations for cross-domain federation testing.
 *
 * @param rid - The unique identifier of the room
 * @param msg - The message text to send
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the API response
 */
export const sendMessage = ({ rid, msg, config }: SendMessageParams) => {
	if (!rid) {
		throw new Error('"rid" is required in "sendMessage" test helper');
	}
	if (!msg) {
		throw new Error('"msg" is required in "sendMessage" test helper');
	}

	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return requestInstance
		.post(methodCall('sendMessage'))
		.set(credentialsInstance)
		.send({
			message: JSON.stringify({
				method: 'sendMessage',
				params: [
					{
						_id: `${Date.now()}-${Math.random()}`,
						rid,
						msg,
					},
				],
				id: `${Date.now()}-${Math.random()}`,
				msg: 'method',
			}),
		});
};

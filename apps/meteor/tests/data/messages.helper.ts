import type { IRoom } from '@rocket.chat/core-typings';

import { api, assertSuccess, credentials, request } from './api-data';
import type { IRequestConfig } from './users.helper';

type SendMessageParams = {
	rid: IRoom['_id'];
	msg: string;
	config?: IRequestConfig;
};

/**
 * Sends a text message through chat.sendMessage, on the instance `config` points to.
 *
 * @throws {RequestFailedError} when the message is not sent
 */
export const sendMessage = async ({ rid, msg, config }: SendMessageParams) => {
	if (!rid) {
		throw new Error('"rid" is required in "sendMessage" test helper');
	}
	if (!msg) {
		throw new Error('"msg" is required in "sendMessage" test helper');
	}

	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.post(api('chat.sendMessage')).set(credentialsInstance).send({ message: { rid, msg } });

	return assertSuccess('chat.sendMessage', res);
};

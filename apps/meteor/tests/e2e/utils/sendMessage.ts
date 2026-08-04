import type { APIRequestContext } from 'playwright-core';

import type { BaseTest } from './test';
import { BASE_API_URL } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

export const sendMessageFromUser = async (request: APIRequestContext, user: IUserState, rid: string, message: string) => {
	return request
		.post(`${BASE_API_URL}/chat.postMessage`, {
			headers: {
				'X-Auth-Token': user.data.loginToken,
				'X-User-Id': user.data._id,
			},
			data: {
				roomId: rid,
				text: message,
			},
		})
		.then((response) => response.json());
};

export const sendFillerMessages = async (api: BaseTest['api'], rid: string, count = 50, batchSize = 10) => {
	const messages = Array.from({ length: count }, (_, i) => `filler message ${i + 1}`);
	for (let i = 0; i < messages.length; i += batchSize) {
		await Promise.all(messages.slice(i, i + batchSize).map((text) => api.post('/chat.postMessage', { roomId: rid, text })));
	}
};

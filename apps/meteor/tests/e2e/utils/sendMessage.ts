import type { APIRequestContext } from 'playwright-core';

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

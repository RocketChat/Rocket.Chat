import { request as baseRequest } from '@playwright/test';

import { BASE_API_URL } from '../config/constants';

type Credentials = {
	password: string;
	username?: string;
	email?: string;
};

const resetOwnE2EKeyMethod = {
	message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
};

export const resetOwnE2EKey = async (credentials: Credentials) => {
	const request = await baseRequest.newContext();

	try {
		const loginResponse = await request.post(`${BASE_API_URL}/login`, { data: credentials });
		const { data } = await loginResponse.json();

		return await request.post(`${BASE_API_URL}/method.call/e2e.resetOwnE2EKey`, {
			data: resetOwnE2EKeyMethod,
			headers: {
				'X-Auth-Token': data.authToken,
				'X-User-Id': data.userId,
			},
		});
	} finally {
		await request.dispose();
	}
};

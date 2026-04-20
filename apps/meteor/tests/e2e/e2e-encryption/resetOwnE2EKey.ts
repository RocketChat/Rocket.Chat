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
	let api: Awaited<ReturnType<typeof baseRequest.newContext>> | undefined;

	try {
		const loginResponse = await request.post(`${BASE_API_URL}/login`, { data: credentials });
		const loginResult = await loginResponse.json();

		api = await baseRequest.newContext({
			extraHTTPHeaders: {
				'X-Auth-Token': loginResult.data.authToken,
				'X-User-Id': loginResult.data.userId,
			},
		});

		const response = await api.post(`${BASE_API_URL}/method.call/e2e.resetOwnE2EKey`, { data: resetOwnE2EKeyMethod });

		if (!response.ok()) {
			throw new Error(`Reset E2E key failed with status ${response.status()}`);
		}

		const result = await response.json();

		if (result.error) {
			throw new Error(`Reset E2E key failed: ${result.error.message || JSON.stringify(result.error)}`);
		}
	} finally {
		await api?.dispose();
		await request.dispose();
	}
};

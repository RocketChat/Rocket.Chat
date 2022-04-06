import { request } from '@playwright/test';

import { apiUrl, apiSufix } from './utils/mocks/urlApi';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

export default async (): Promise<void> => {
	console.log('[Info] Creating normal user');
	const normalUser = {
		username: `normal_user`,
		email: 'normal_user@rocket.chat',
		password: 'normal_user',
		name: 'Normal User',
	};

	const api = await request.newContext();

	const adminCredentials = await api.post(`${apiUrl}${apiSufix}login`, { data: adminLogin });
	const adminData = JSON.parse(await adminCredentials.text());

	const result = await api.post(`${apiUrl}${apiSufix}users.create`, {
		data: normalUser,
		headers: {
			'X-Auth-Token': adminData.data.authToken,
			'X-User-Id': adminData.data.userId,
		},
	});

	console.log(JSON.parse(await result.text()));
};

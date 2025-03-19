import { request } from '@playwright/test';

import { Users } from './userStates';
import { BASE_API_URL, BASE_URL, TEST_APP_URL } from '../config/constants';

export default async function insertApp(): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data.username,
	};

	await api.post(`${BASE_URL}/api/apps`, { data: { url: TEST_APP_URL }, headers });
	await api.post(`${BASE_API_URL}/settings/VideoConf_Default_Provider`, { data: { value: 'test' }, headers });
}

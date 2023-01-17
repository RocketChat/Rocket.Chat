import { request } from '@playwright/test';

import { BASE_API_URL, ADMIN_CREDENTIALS, BASE_URL } from '../config/constants';

const APP_URL = 'https://github.com/RocketChat/Apps.RocketChat.Tester/blob/master/dist/appsrocketchattester_0.0.5.zip?raw=true';

export default async function insertApp(): Promise<void> {
	const api = await request.newContext();

	const response = await api.post(`${BASE_API_URL}/login`, { data: ADMIN_CREDENTIALS });
	const jsonToken = await response.json();

	const headers = {
		'X-Auth-Token': jsonToken.data.authToken,
		'X-User-Id': jsonToken.data.userId,
	};

	const { value } = await (await api.get(`${BASE_API_URL}/settings/Apps_Framework_Development_Mode`, { headers })).json();

	if (!value) {
		await api.post(`${BASE_API_URL}/settings/Apps_Framework_enabled`, { data: { value: true }, headers });
		await api.post(`${BASE_API_URL}/settings/Apps_Framework_Development_Mode`, { data: { value: true }, headers });
		await api.post(`${BASE_URL}/api/apps`, { data: { url: APP_URL }, headers });
		await api.post(`${BASE_API_URL}/settings/VideoConf_Default_Provider`, { data: { value: 'test' }, headers });
	}
}

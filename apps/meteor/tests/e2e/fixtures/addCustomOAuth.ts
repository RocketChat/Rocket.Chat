import { request } from '@playwright/test';

import { BASE_API_URL } from '../config/constants';
import { Users } from './userStates';

export default async function addCustomOAuth(): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data.username,
	};

	await api.post(`${BASE_API_URL}/settings.addCustomOAuth`, { data: { name: 'Test' }, headers });
	await api.post(`${BASE_API_URL}/settings/Accounts_OAuth_Custom-Test`, { data: { value: false }, headers });
	await api.post(`${BASE_API_URL}/settings/Accounts_OAuth_Custom-Test-url`, { data: { value: 'https://rocket.chat' }, headers });
	await api.post(`${BASE_API_URL}/settings/Accounts_OAuth_Custom-Test-login_style`, { data: { value: 'redirect' }, headers });
}

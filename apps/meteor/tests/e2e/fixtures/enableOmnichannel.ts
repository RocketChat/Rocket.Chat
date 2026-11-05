import { request } from '@playwright/test';

import { Users } from './userStates';
import { BASE_API_URL } from '../config/constants';

export default async function enableOmnichannel(): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data._id,
	};

	const response = await api.post(`${BASE_API_URL}/settings/Livechat_enabled`, { data: { value: true }, headers });

	if (!response.ok()) {
		throw new Error(`Failed to enable Omnichannel: ${response.status()} ${await response.text()}`);
	}
}

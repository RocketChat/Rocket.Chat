import fs from 'fs';

import { request } from '@playwright/test';

import { Users } from './userStates';
import { APP_URL } from '../../data/apps/apps-data';
import { BASE_API_URL, BASE_URL } from '../config/constants';
import { expect } from '../utils/test';

export default async function insertApp(): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data.username,
	};

	await api.post(`${BASE_URL}/api/apps`, { data: { url: APP_URL }, headers });
	await api.post(`${BASE_API_URL}/settings/VideoConf_Default_Provider`, { data: { value: 'test' }, headers });
}

export async function installLocalTestPackage(packagePath: string): Promise<{ app: { id: string } }> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data.username,
	};

	const response = await api.post(`${BASE_URL}/api/apps`, { multipart: { app: fs.createReadStream(packagePath) }, headers });

	await expect(response).toBeOK();

	return response.json();
}

export async function getAppLogs(
	appId: string,
): Promise<{ success: boolean; logs: Array<{ method: string; entries: Array<{ args: unknown[] }> }> }> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data.username,
	};

	const response = await api.get(`${BASE_URL}/api/apps/${appId}/logs`, { headers });

	return response.json();
}

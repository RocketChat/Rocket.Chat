import fs from 'fs';

import { request } from '@playwright/test';
import type { Endpoints } from '@rocket.chat/rest-typings';

import { expect, type BaseTest } from './test';
import { APP_URL } from '../../data/apps/apps-data';
import { BASE_API_URL, BASE_URL } from '../config/constants';
import { Users } from '../fixtures/userStates';

export async function insertDefaultTestApp(): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data._id,
	};

	await api.post(`${BASE_URL}/api/apps`, { data: { url: APP_URL }, headers });
	await api.post(`${BASE_API_URL}/settings/VideoConf_Default_Provider`, { data: { value: 'test' }, headers });
}

export async function installLocalTestPackage(packagePath: string): Promise<{ app: { id: string } }> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data._id,
	};

	const response = await api.post(`${BASE_URL}/api/apps`, { multipart: { app: fs.createReadStream(packagePath) }, headers });

	await expect(response).toBeOK();

	return response.json();
}

export async function uninstallApp(appId: string): Promise<void> {
	const api = await request.newContext();

	const headers = {
		'X-Auth-Token': Users.admin.data.loginToken,
		'X-User-Id': Users.admin.data._id,
	};

	const response = await api.delete(`${BASE_URL}/api/apps/${appId}`, { headers });

	await expect(response).toBeOK();
}

export async function getAppLogs(api: BaseTest['api'], appId: string): Promise<ReturnType<Endpoints['/apps/:id/logs']['GET']>> {
	const response = await api.get(`/apps/${appId}/logs`, undefined, '/api');

	await expect(response).toBeOK();

	return response.json();
}

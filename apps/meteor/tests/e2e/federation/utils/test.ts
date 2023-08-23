import type { APIResponse } from '@playwright/test';
import { test as baseTest } from '@playwright/test';

import { API_PREFIX } from '../../config/constants';
import * as constants from '../config/constants';

export type AnyObj = { [key: string]: any };

export type API = {
	get(uri: string, prefix?: string): Promise<APIResponse>;
	post(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
	put(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
	delete(uri: string, prefix?: string): Promise<APIResponse>;
};

export type BaseTest = {
	apiServer1: API;
	apiServer2: API;
};

const api = async (request: any, use: any, user: string, password: string, baseUrl: string) => {
	const resp = await request.post(`${baseUrl + API_PREFIX}/login`, { data: { user, password } });
	const json = await resp.json();

	const headers = {
		'X-Auth-Token': json.data.authToken,
		'X-User-Id': json.data.userId,
	};

	await use({
		get(uri: string, prefix = API_PREFIX) {
			return request.get(baseUrl + prefix + uri, { headers });
		},
		post(uri: string, data: AnyObj, prefix = API_PREFIX) {
			return request.post(baseUrl + prefix + uri, { headers, data });
		},
		put(uri: string, data: AnyObj, prefix = API_PREFIX) {
			return request.put(baseUrl + prefix + uri, { headers, data });
		},
		delete(uri: string, prefix = API_PREFIX) {
			return request.delete(baseUrl + prefix + uri, { headers });
		},
	});
};

export const test = baseTest.extend<BaseTest>({
	apiServer1: async ({ request }, use) =>
		api(request, use, constants.RC_SERVER_1.username, constants.RC_SERVER_1.password, constants.RC_SERVER_1.url),
	apiServer2: async ({ request }, use) =>
		api(request, use, constants.RC_SERVER_2.username, constants.RC_SERVER_2.password, constants.RC_SERVER_2.url),
});

export const { expect } = test;

export const setupTesting = async (api: API) => {
	await api.post('/settings/Message_AudioRecorderEnabled', { value: true });
	await api.post('/settings/Accounts_ManuallyApproveNewUsers', { value: false });
	await api.post('/settings/API_Enable_Rate_Limiter', { value: false });
	await api.post('/settings/DDP_Rate_Limit_IP_Enabled', { value: false });
	await api.post('/settings/DDP_Rate_Limit_User_Enabled', { value: false });
	await api.post('/settings/DDP_Rate_Limit_Connection_Enabled', { value: false });
	await api.post('/settings/DDP_Rate_Limit_Connection_Interval_Time', { value: false });
	await api.post('/settings/DDP_Rate_Limit_User_By_Method_Enabled', { value: false });
	await api.post('/settings/DDP_Rate_Limit_Connection_By_Method_Enabled', { value: false });
	await api.post('/settings/Accounts_RegistrationForm', { value: 'Public' });
	await api.post('/settings/UI_Use_Real_Name', { value: false });
	await api.post('/settings/Rate_Limiter_Limit_RegisterUser', { value: 10 });
	await api.post('/settings/Hide_System_Messages', { value: [] });
	await api.post('/permissions.update', { permissions: [{ _id: 'force-delete-message', roles: ['admin', 'user'] }] });
};

export const tearDownTesting = async (api: API) => {
	await api.post('/settings/Accounts_ManuallyApproveNewUsers', { value: true });
	await api.post('/settings/API_Enable_Rate_Limiter', { value: true });
	await api.post('/settings/DDP_Rate_Limit_IP_Enabled', { value: true });
	await api.post('/settings/DDP_Rate_Limit_User_Enabled', { value: true });
	await api.post('/settings/DDP_Rate_Limit_Connection_Enabled', { value: true });
	await api.post('/settings/DDP_Rate_Limit_Connection_Interval_Time', { value: true });
	await api.post('/settings/DDP_Rate_Limit_User_By_Method_Enabled', { value: true });
	await api.post('/settings/DDP_Rate_Limit_Connection_By_Method_Enabled', { value: true });
	await api.post('/settings/Rate_Limiter_Limit_RegisterUser', { value: 1 });
	await api.post('/settings/Accounts_RegistrationForm', { value: 'Disabled' });
};

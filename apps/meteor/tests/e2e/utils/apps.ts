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

type AppLogs = Awaited<ReturnType<typeof getAppLogs>>['logs'];

/**
 * Finds a log entry matching a handler method and a specific debug label.
 * Apps log using `this.getLogger().debug(label, value)`, creating entries with args = [label, value].
 * Each handler invocation creates a log group with `method` like `app:executeBlockActionHandler`.
 *
 * Pass only `arg0` to match on the label alone, or both to also require a specific value.
 */
export function findAppLogItem(logs: AppLogs, methodFragment: string, [arg0, arg1]: [arg0: string, arg1?: string]) {
	return logs.find(
		(log) =>
			log.method.includes(methodFragment) && log.entries.some((entry) => arg0 === entry.args[0] && (!arg1 || arg1 === entry.args[1])),
	);
}

/** Reads the value logged under `label` by a given handler, or undefined if it never logged it. */
export function getAppLogValue(logs: AppLogs, methodFragment: string, label: string): string | undefined {
	const log = findAppLogItem(logs, methodFragment, [label]);

	return log?.entries.find((entry) => entry.args[0] === label)?.args[1];
}

/** The newest log group for a handler, or undefined. Logs come back newest-first. */
export async function getNewestAppLog(api: BaseTest['api'], appId: string, methodFragment: string): Promise<AppLogs[number] | undefined> {
	const { logs } = await getAppLogs(api, appId);

	return logs.find((log) => log.method.includes(methodFragment));
}

/**
 * Waits for a handler to log something it hadn't logged before, and returns that log group.
 *
 * Needed for fire-and-forget app events: nothing in the request/response cycle waits on them, so
 * there is no response to await. Pass the `_id` of the newest log for that handler taken *before*
 * the action, so a log left behind by an earlier test in the same spec isn't mistaken for this one.
 */
export async function waitForNewAppLog(
	api: BaseTest['api'],
	appId: string,
	methodFragment: string,
	previousLogId?: string,
): Promise<AppLogs[number]> {
	let found: AppLogs[number] | undefined;

	await expect
		.poll(
			async () => {
				const newest = await getNewestAppLog(api, appId, methodFragment);

				if (!newest || newest._id === previousLogId) {
					return false;
				}

				found = newest;
				return true;
			},
			{ message: `Timed out waiting for a new "${methodFragment}" app log`, timeout: 20_000 },
		)
		.toBe(true);

	return found as AppLogs[number];
}

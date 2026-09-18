import type { App } from '@rocket.chat/core-typings';
import type { Endpoints } from '@rocket.chat/rest-typings';

import { request, credentials } from '../api-data';
import { waitUntil } from '../utils';
import { apps, APP_URL, installedApps } from './apps-data';

const getApps = () =>
	new Promise<App[]>((resolve) => {
		void request
			.get(installedApps())
			.set(credentials)
			.end((_err, res) => {
				resolve(res.body.apps);
			});
	});

const removeAppById = (id: App['id']) =>
	new Promise((resolve) => {
		void request
			.delete(apps(`/${id}`))
			.set(credentials)
			.end(resolve);
	});

export const cleanupApps = async () => {
	const apps = await getApps();
	await Promise.all(apps.map((testApp) => removeAppById(testApp.id)));
};

export const installTestApp = () =>
	new Promise<App>((resolve) => {
		void request
			.post(apps())
			.set(credentials)
			.send({
				url: APP_URL,
			})
			.end((_err, res) => {
				resolve(res.body.app);
			});
	});

export const installLocalTestPackage = (path: string) =>
	new Promise<App>((resolve, reject) => {
		void request
			.post(apps())
			.set(credentials)
			.attach('app', path)
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				return resolve(res.body.app);
			});
	});

type AppLogs = Awaited<ReturnType<Endpoints['/apps/:id/logs']['GET']>>['logs'];

export type AppLog = AppLogs[number];

export const getAppLogs = async (appId: App['id']): Promise<AppLogs> => {
	const response = await request
		.get(apps(`/${appId}/logs`))
		.set(credentials)
		.expect(200);

	return response.body.logs;
};

/**
 * Finds a log group a handler wrote, by a label it logged and optionally the value it logged under it.
 *
 * Apps log with `this.getLogger().debug(label, value)`, so each entry is `args = [label, value]`, and
 * each handler run is its own group with `method` like `app:executePostMediaCallEnded`.
 */
export const findAppLogItem = (logs: AppLogs, methodFragment: string, [label, value]: [label: string, value?: string]) =>
	logs.find(
		(log) =>
			log.method.includes(methodFragment) && log.entries.some((entry) => label === entry.args[0] && (!value || value === entry.args[1])),
	);

/** The value a handler logged under `label`, within one already-located log group. */
export const entryValue = (log: AppLog | undefined, label: string): string | undefined =>
	log?.entries.find((entry) => entry.args[0] === label)?.args[1];

/** The newest log group for a handler, or undefined. Logs come back newest-first. */
export const getNewestAppLog = async (appId: App['id'], methodFragment: string): Promise<AppLog | undefined> => {
	const logs = await getAppLogs(appId);

	return logs.find((log) => log.method.includes(methodFragment));
};

/**
 * Waits for a handler to log something it hadn't logged before, and returns that log group.
 *
 * Needed for fire-and-forget app events: nothing in the request/response cycle waits on them, so
 * there is no response to await. Pass the `_id` of the newest log for that handler taken *before*
 * the action, so a log an earlier test left behind isn't mistaken for this one.
 */
export const waitForNewAppLog = async (appId: App['id'], methodFragment: string, previousLogId?: string): Promise<AppLog> =>
	waitUntil(
		async () => {
			const newest = await getNewestAppLog(appId, methodFragment);

			return newest && newest._id !== previousLogId ? newest : undefined;
		},
		{ description: `a new "${methodFragment}" app log` },
	);

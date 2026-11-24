import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { App } from '@rocket.chat/core-typings';

import { request, credentials } from '../api-data';
import { appRocketChatTester } from './app-packages';
import { apps, installedApps } from './apps-data';

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

export const installLocalTestPackage = async (path: string, permissions?: IPermission[]): Promise<App> => {
	const req = request.post(apps()).set(credentials).attach('app', path);
	const res = await (permissions ? req.field('permissions', JSON.stringify(permissions)) : req);

	if (!res.body?.success) {
		throw new Error(`Failed to install ${path}: ${res.status} ${res.text}`);
	}

	return res.body.app;
};

export const installTestApp = () => installLocalTestPackage(appRocketChatTester);

import type { IPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { App } from '@rocket.chat/core-typings';

import { request, credentials } from '../api-data';
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

export const installLocalTestPackage = (path: string, permissions?: IPermission[]) =>
	new Promise<App>((resolve, reject) => {
		const req = request.post(apps()).set(credentials).attach('app', path);

		void (permissions ? req.field('permissions', JSON.stringify(permissions)) : req).end((err, res) => {
			if (err) {
				return reject(err);
			}
			return resolve(res.body.app);
		});
	});

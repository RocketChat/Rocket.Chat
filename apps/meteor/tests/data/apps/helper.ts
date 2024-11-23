import type { App } from '@rocket.chat/core-typings';

import { request, credentials } from '../api-data';
import { apps, APP_URL, APP_NAME } from './apps-data';

const getApps = () =>
	new Promise<App[]>((resolve) => {
		void request
			.get(apps())
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
	const testApp = apps.find((app) => app.name === APP_NAME);
	if (testApp) {
		await removeAppById(testApp.id);
	}
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

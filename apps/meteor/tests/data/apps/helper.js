import { request, credentials } from '../api-data';
import { apps, APP_URL, APP_NAME } from './apps-data';

export const getApps = () =>
	new Promise((resolve) => {
		request
			.get(apps())
			.set(credentials)
			.end((err, res) => {
				resolve(res.body.apps);
			});
	});

export const removeAppById = (id) =>
	new Promise((resolve) => {
		request
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
	new Promise((resolve) => {
		request
			.post(apps())
			.set(credentials)
			.send({
				url: APP_URL,
			})
			.end((err, res) => {
				resolve(res.body.app);
			});
	});

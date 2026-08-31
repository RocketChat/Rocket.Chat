import type { App, AppPermission } from '@rocket.chat/core-typings';
import AdmZip from 'adm-zip';

import { request, credentials } from '../api-data';
import { apps, APP_URL, installedApps } from './apps-data';

/**
 * Gets the permissions declared in the app manifest file of a test app package.
 *
 * @param pathToApp Path to test app package
 * @returns A promise that resolves to the list of permission objects, or undefined if not available. Rejects if not able to read the manifest file.
 */
async function getPermissionsFromAppManifest(pathToApp: string): Promise<AppPermission[] | undefined> {
	try {
		const zip = new AdmZip(pathToApp);

		const { promise, resolve, reject } = Promise.withResolvers<string>();

		zip.readAsTextAsync('app.json', (data, err) => {
			if (err) {
				return reject(err);
			}

			resolve(data);
		});

		const appJsonContent = await promise;

		const appJson = JSON.parse(appJsonContent);

		return appJson.permissions;
	} catch (e) {
		throw new Error(`Failed to read app manifest from "${pathToApp}"`, { cause: e });
	}
}

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

export const installLocalTestPackage = async (path: string, { withPermissions = true }: { withPermissions?: boolean } = {}) => {
	const req = request.post(apps()).set(credentials).attach('app', path);

	if (withPermissions) {
		const permissions = await getPermissionsFromAppManifest(path);

		if (permissions) {
			req.field('permissions', JSON.stringify(permissions));
		}
	}

	const res = await req;

	return res.body.app as App;
};

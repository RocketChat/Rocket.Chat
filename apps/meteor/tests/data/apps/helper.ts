import type { App, AppPermission } from '@rocket.chat/core-typings';
import AdmZip from 'adm-zip';

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

/**
 * Reads the permissions an app package asks for out of its own manifest.
 *
 * Installing over REST does not grant manifest permissions on its own -- they have to be sent
 * alongside the package -- so a test covering a permission-gated accessor needs them from here.
 */
async function getPermissionsFromAppManifest(pathToApp: string): Promise<AppPermission[] | undefined> {
	try {
		const zip = new AdmZip(pathToApp);
		const appJson = JSON.parse(zip.readAsText('app.json')) as { permissions?: AppPermission[] };

		return appJson.permissions;
	} catch (e) {
		throw new Error(`Failed to read app manifest from "${pathToApp}"`, { cause: e });
	}
}

/**
 * Installs an app package from disk.
 *
 * Permissions declared in the manifest are granted by default, which is what a test asserting
 * an accessor works needs. Pass `withPermissions: false` to install the same package ungranted,
 * which is how the denial path gets covered.
 *
 * Beware that granting *replaces* the default permissions rather than adding to them
 * (`AppManager.getPermissionsGranted` returns `permissionsGranted || defaultPermissions`). A manifest
 * that names only the permission under test therefore drops everything else, `api` included, and the
 * app's HTTP endpoints stop mounting — so a package used this way has to declare every permission it
 * relies on, not just the interesting one.
 */
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

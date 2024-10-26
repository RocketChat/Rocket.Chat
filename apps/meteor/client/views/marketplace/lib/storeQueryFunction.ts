import type { App } from '../types';

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

/**
 * Aggregates result data from marketplace request and instance installed into their appropriate lists
 *
 * Exporting for better testing
 */
export function storeQueryFunction(
	marketplace: App[],
	installed: App[],
): [marketplaceApps: App[], installedApps: App[], privateApps: App[]] {
	const marketplaceApps: App[] = [];
	const installedApps: App[] = [];
	const privateApps: App[] = [];
	const clonedData = [...installed];

	sortByName(marketplace).forEach((app) => {
		const appIndex = clonedData.findIndex(({ id }) => id === app.id);
		const [installedApp] = appIndex > -1 ? clonedData.splice(appIndex, 1) : [];

		const record = {
			...app,
			...(installedApp && {
				private: installedApp.private,
				installed: true,
				status: installedApp.status,
				version: installedApp.version,
				licenseValidation: installedApp.licenseValidation,
				migrated: installedApp.migrated,
				installedAddon: installedApp.addon,
			}),
			bundledIn: app.bundledIn,
			marketplaceVersion: app.version,
		};

		if (installedApp) {
			if (installedApp.private) {
				privateApps.push(record);
			} else {
				installedApps.push(record);
			}
		}

		marketplaceApps.push(record);
	});

	sortByName(clonedData).forEach((app) => {
		if (app.private) {
			privateApps.push(app);
			return;
		}

		installedApps.push(app);
	});

	return [marketplaceApps, installedApps, privateApps];
}

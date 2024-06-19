import { type UseQueryResult } from '@tanstack/react-query';

import type { App } from '../../views/marketplace/types';

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

/**
 * Aggregates result data from marketplace request and instance installed into their appropriate lists
 *
 * Exporting for better testing
 */
export function storeQueryFunction(
	marketplace: UseQueryResult<App[], unknown>,
	instance: UseQueryResult<App[], unknown>,
): [App[], App[], App[]] {
	if (!marketplace.isFetched && !instance.isFetched) {
		throw new Error('Apps not loaded');
	}

	const marketplaceApps: App[] = [];
	const installedApps: App[] = [];
	const privateApps: App[] = [];
	const clonedData = [...(instance.data || [])];

	sortByName(marketplace.data || []).forEach((app) => {
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

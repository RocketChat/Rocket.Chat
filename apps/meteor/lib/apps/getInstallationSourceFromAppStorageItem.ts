import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { LicenseAppSources } from '@rocket.chat/core-typings';

/**
 * There have been reports of apps not being correctly migrated from versions prior to 6.0
 *
 * This function is a workaround to get the installation source of an app from the app storage item
 * even if the installationSource property is not set.
 */
export function getInstallationSourceFromAppStorageItem(item: IAppStorageItem): LicenseAppSources {
	return item.installationSource || ('marketplaceInfo' in item ? 'marketplace' : 'private');
}

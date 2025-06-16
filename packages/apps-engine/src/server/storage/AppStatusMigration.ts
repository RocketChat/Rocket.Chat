import { AppStatus } from '../../definition/AppStatus';
import { AppDesiredStatus } from '../../definition/AppDesiredStatus';
import type { IAppStorageItem } from './IAppStorageItem';

export class AppStatusMigration {
	/**
	 * Migrates the legacy single status field to the new dual-status system
	 * @param item The app storage item to migrate
	 * @returns The migrated app storage item with both desiredStatus and initStatus
	 */
	public static migrateLegacyStatus(item: IAppStorageItem): IAppStorageItem {
		// If already migrated (has both new fields), return as-is
		if (item.desiredStatus && item.initStatus) {
			return item;
		}

		const legacyStatus = item.status;
		
		// Set initStatus to the current status
		item.initStatus = legacyStatus;
		
		// Determine desiredStatus based on legacy status
		item.desiredStatus = this.mapLegacyStatusToDesiredStatus(legacyStatus);
		
		return item;
	}

	/**
	 * Maps a legacy AppStatus to the appropriate AppDesiredStatus
	 * @param legacyStatus The legacy status to map
	 * @returns The corresponding desired status
	 */
	private static mapLegacyStatusToDesiredStatus(legacyStatus: AppStatus): AppDesiredStatus {
		switch (legacyStatus) {
			case AppStatus.AUTO_ENABLED:
			case AppStatus.MANUALLY_ENABLED:
				return AppDesiredStatus.ENABLED;
			
			case AppStatus.MANUALLY_DISABLED:
			case AppStatus.DISABLED:
				return AppDesiredStatus.DISABLED;
			
			case AppStatus.COMPILER_ERROR_DISABLED:
			case AppStatus.ERROR_DISABLED:
			case AppStatus.INVALID_LICENSE_DISABLED:
			case AppStatus.INVALID_INSTALLATION_DISABLED:
			case AppStatus.INVALID_SETTINGS_DISABLED:
				// For error states, we assume the desired state was enabled
				// since these represent failed attempts to enable
				return AppDesiredStatus.ENABLED;
			
			case AppStatus.UNKNOWN:
			case AppStatus.CONSTRUCTED:
			case AppStatus.INITIALIZED:
			default:
				// For transitional states, default to disabled to be safe
				return AppDesiredStatus.DISABLED;
		}
	}

	/**
	 * Batch migrates multiple app storage items
	 * @param items Array of app storage items to migrate
	 * @returns Array of migrated app storage items
	 */
	public static batchMigrateLegacyStatus(items: IAppStorageItem[]): IAppStorageItem[] {
		return items.map(item => this.migrateLegacyStatus(item));
	}

	/**
	 * Determines if an app storage item needs migration
	 * @param item The app storage item to check
	 * @returns True if migration is needed, false otherwise
	 */
	public static needsMigration(item: IAppStorageItem): boolean {
		return !item.desiredStatus || !item.initStatus;
	}

	/**
	 * Creates a new app storage item with default dual-status values
	 * @param baseItem The base item data
	 * @param desiredStatus The desired status for the new app
	 * @returns A new app storage item with proper dual-status setup
	 */
	public static createWithDualStatus(
		baseItem: Omit<IAppStorageItem, 'desiredStatus' | 'initStatus'>,
		desiredStatus: AppDesiredStatus = AppDesiredStatus.DISABLED
	): IAppStorageItem {
		return {
			...baseItem,
			desiredStatus,
			initStatus: AppStatus.UNKNOWN,
		};
	}
}
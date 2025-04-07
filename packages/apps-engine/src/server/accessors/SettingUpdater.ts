import type { ISettingUpdater } from '../../definition/accessors/ISettingUpdater';
import type { ISetting } from '../../definition/settings';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppSettingsManager } from '../managers';

/**
 * Implementation of ISettingUpdater that provides methods to update app settings.
 */
export class SettingUpdater implements ISettingUpdater {
    constructor(
        private readonly app: ProxiedApp,
        private readonly manager: AppSettingsManager,
    ) {}

    /**
     * Updates a single setting value
     * @param id The setting ID to update
     * @param value The new value to set
     * @returns Promise that resolves when the update is complete
     * @throws Error if the setting doesn't exist
     */
    public async updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void> {
        const appId = this.app.getID();
        const storageItem = this.app.getStorageItem();

        if (!storageItem.settings?.[id]) {
            throw new Error(`Setting "${id}" not found for app ${appId}`);
        }

        const setting = this.manager.getAppSetting(appId, id);

        this.manager.updateAppSetting(appId, {
            ...setting,
            updatedAt: new Date(),
            value,
        });
    }

    /**
     * Updates the values for a multi-value setting by overwriting them
     * @param id The setting ID to update
     * @param values The new values to set
     * @returns Promise that resolves when the update is complete
     * @throws Error if the setting doesn't exist
     */
    public async updateSelectOptions(id: ISetting['id'], values: ISetting['values']): Promise<void> {
        const appId = this.app.getID();
        const storageItem = this.app.getStorageItem();

        if (!storageItem.settings?.[id]) {
            throw new Error(`Setting "${id}" not found for app ${appId}`);
        }

        const setting = this.manager.getAppSetting(appId, id);

        // TODO: This operation completely overwrites existing values
        // which could lead to loss of selected values. Consider:
        // Adding warning logs when selected value will be removed

        this.manager.updateAppSetting(appId, {
            ...setting,
            updatedAt: new Date(),
            values, // Overwrite the values instead of merging
        });
    }
}

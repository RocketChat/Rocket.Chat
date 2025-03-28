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
     * Merges new values with existing values for a multi-value setting
     * @param id The setting ID to update
     * @param values The values to merge with existing values
     * @returns Promise that resolves when the update is complete
     * @throws Error if the setting doesn't exist
     */
    public async updateValues(id: ISetting['id'], values: ISetting['values']): Promise<void> {
        const appId = this.app.getID();
        const storageItem = this.app.getStorageItem();

        if (!storageItem.settings?.[id]) {
            throw new Error(`Setting "${id}" not found for app ${appId}`);
        }

        const setting = this.manager.getAppSetting(appId, id);
        const currentValues = setting.values;

        this.manager.updateAppSetting(appId, {
            ...setting,
            updatedAt: new Date(),
            values: [...currentValues, ...values],
        });
    }

    /**
     * Removes specific keys from a multi-value setting
     * @param id The setting ID to update
     * @param keysToRemove Array of keys to remove from the values
     * @returns Promise that resolves when the update is complete
     * @throws Error if the setting doesn't exist
     */
    public async removeValues(id: ISetting['id'], keysToRemove: string[]): Promise<void> {
        const appId = this.app.getID();
        const storageItem = this.app.getStorageItem();

        if (!storageItem.settings?.[id]) {
            throw new Error(`Setting "${id}" not found for app ${appId}`);
        }

        // Exit early if there's nothing to remove
        if (!keysToRemove.length) {
            return;
        }

        const setting = this.manager.getAppSetting(appId, id);

        const keysSet = new Set(keysToRemove);
        const currentValues = setting.values || [];
        const updatedValues = Array.isArray(currentValues) ? currentValues.filter((value) => !keysSet.has(value.key)) : currentValues;

        this.manager.updateAppSetting(appId, {
            ...setting,
            updatedAt: new Date(),
            values: updatedValues,
        });
    }
}

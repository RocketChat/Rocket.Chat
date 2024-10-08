import type { ISetting } from '../settings/index';

/**
 * This accessor provides methods for adding custom settings,
 * which are displayed on your App's page.
 * This is provided on initialization of your App.
 */
export interface ISettingsExtend {
    /**
     * Adds a setting which can be configured by an administrator.
     * Settings can only be added to groups which have been provided by this App earlier
     * and if a group is not provided, the setting will appear outside of a group.
     *
     * @param setting the setting
     */
    provideSetting(setting: ISetting): Promise<void>;
}

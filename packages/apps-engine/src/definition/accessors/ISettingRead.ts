import type { ISetting } from '../settings/index';

/**
 * This accessor provides methods for accessing
 * App settings in a read-only-fashion.
 */
export interface ISettingRead {
    /**
     * Gets the App's setting by the provided id.
     * Does not throw an error but instead will return undefined it doesn't exist.
     *
     * @param id the id of the setting
     */
    getById(id: string): Promise<ISetting>;

    /**
     * Gets the App's setting value by the provided id.
     * Note: this will throw an error if the setting doesn't exist
     *
     * @param id the id of the setting value to get
     */
    getValueById(id: string): Promise<any>;
}

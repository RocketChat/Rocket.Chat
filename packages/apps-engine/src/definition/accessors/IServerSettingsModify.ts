import type { ISetting } from '../settings';

/**
 * This accessor provides methods to change default setting options
 * of Rocket.Chat in a compatible way. It is provided during
 * your App's "onEnable".
 */
export interface IServerSettingsModify {
    /**
     * Hides an existing settings group.
     *
     * @param name The technical name of the group
     */
    hideGroup(name: string): Promise<void>;

    /**
     * Hides a setting. This does not influence the actual functionality (the setting will still
     * have its value and can be programatically read), but the administrator will not be able to see it anymore
     *
     * @param id the id of the setting to hide
     */
    hideSetting(id: string): Promise<void>;

    /**
     * Modifies the configured value of another setting, please use it with caution as an invalid
     * setting configuration could cause a Rocket.Chat instance to become unstable.
     *
     * @param setting the modified setting (id must be provided)
     */
    modifySetting(setting: ISetting): Promise<void>;

    /**
     * Increases the setting value by the specified amount.
     * To be used only with statistic settings that track the amount of times an action has been performed
     *
     * @param id the id of the existing Rocket.Chat setting
     * @param value how much should the count be increased by. Defaults to 1.
     */
    incrementValue(id: ISetting['id'], value?: number): Promise<void>;
}

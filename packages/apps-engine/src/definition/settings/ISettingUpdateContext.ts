import type { ISetting } from './ISetting';

/**
 * Both sides of a setting change, handed to `App.onPreSettingUpdate` before the
 * new value is stored.
 *
 * Return an adjusted copy of `newSetting` to correct or reject what the
 * administrator typed.
 */
export interface ISettingUpdateContext {
	/** The setting as it is currently stored. */
	oldSetting: ISetting;
	/** The setting as the administrator wants it to become. */
	newSetting: ISetting;
}

import type { ISetting } from '../settings/ISetting';

/**
 * Changes the App's own settings, the ones it declared in
 * `extendConfiguration`.
 *
 * A change made here does not call the App's `onSettingUpdated`, which fires
 * for changes made from outside the App.
 */
export interface ISettingUpdater {
	updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void>;
	updateSelectOptions(id: ISetting['id'], values: ISetting['values']): Promise<void>;
}

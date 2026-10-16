import type { ISetting } from '../settings/ISetting';

/**
 * Changes the workspace's own settings, the ones an administrator sets.
 *
 * This reaches outside the App: it needs the `server-setting.write`
 * permission. Use `ISettingUpdater` for the App's own settings.
 */
export interface IServerSettingUpdater {
	updateOne(setting: ISetting): Promise<void>;
	incrementValue(id: ISetting['id'], value?: number): Promise<void>;
}

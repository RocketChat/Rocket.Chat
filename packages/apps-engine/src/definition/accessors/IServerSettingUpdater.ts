import type { ISetting } from '../settings/ISetting';

export interface IServerSettingUpdater {
    updateOne(setting: ISetting): Promise<void>;
    incrementValue(id: ISetting['id'], value?: number): Promise<void>;
}

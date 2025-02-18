import type { ISetting } from '../settings/ISetting';
export interface ISettingUpdater {
    updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void>;
}

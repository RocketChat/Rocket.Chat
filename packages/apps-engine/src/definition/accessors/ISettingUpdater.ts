import type { ISetting } from '../settings/ISetting';

export interface ISettingUpdater {
    updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void>;
    updateValues(id: ISetting['id'], values: ISetting['values']): Promise<void>;
    removeValues(id: ISetting['id'], keysToRemove: string[]): Promise<void>;
}

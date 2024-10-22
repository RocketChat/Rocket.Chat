import type { ISetting } from './ISetting';

export interface ISettingUpdateContext {
    oldSetting: ISetting;
    newSetting: ISetting;
}

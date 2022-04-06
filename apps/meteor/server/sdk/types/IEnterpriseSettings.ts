import { IServiceClass } from './ServiceClass';
import type { ISetting } from '@rocket.chat/core-typings';

export interface IEnterpriseSettings extends IServiceClass {
	changeSettingValue(record: ISetting): undefined | ISetting['value'];
}

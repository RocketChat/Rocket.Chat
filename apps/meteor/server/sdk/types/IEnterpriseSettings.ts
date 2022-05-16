import type { ISetting } from '@rocket.chat/core-typings';

import { IServiceClass } from './ServiceClass';

export interface IEnterpriseSettings extends IServiceClass {
	changeSettingValue(record: ISetting): undefined | ISetting['value'];
}

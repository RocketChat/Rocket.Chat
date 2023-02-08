import type { ISetting } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IEnterpriseSettings extends IServiceClass {
	changeSettingValue(record: ISetting): undefined | ISetting['value'];
}

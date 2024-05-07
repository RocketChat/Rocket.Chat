import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IEnterpriseSettings } from '@rocket.chat/core-services';
import type { ISetting } from '@rocket.chat/core-typings';

import { changeSettingValue } from './settings';

export class EnterpriseSettings extends ServiceClassInternal implements IEnterpriseSettings {
	protected name = 'ee-settings';

	protected internal = true;

	changeSettingValue(record: ISetting): undefined | ISetting['value'] {
		return changeSettingValue(record);
	}
}

import type { ISetting } from '@rocket.chat/core-typings';
import { ServiceClassInternal } from '@rocket.chat/core-sdk';
import type { IEnterpriseSettings } from '@rocket.chat/core-sdk';

import { changeSettingValue } from './settings';

export class EnterpriseSettings extends ServiceClassInternal implements IEnterpriseSettings {
	protected name = 'ee-settings';

	protected internal = true;

	changeSettingValue(record: ISetting): undefined | ISetting['value'] {
		return changeSettingValue(record);
	}
}

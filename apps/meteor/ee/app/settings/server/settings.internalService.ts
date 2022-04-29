import type { ISetting } from '@rocket.chat/core-typings';

import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';
import { IEnterpriseSettings } from '../../../../server/sdk/types/IEnterpriseSettings';
import { changeSettingValue } from './settings';

export class EnterpriseSettings extends ServiceClassInternal implements IEnterpriseSettings {
	protected name = 'ee-settings';

	protected internal = true;

	changeSettingValue(record: ISetting): undefined | ISetting['value'] {
		return changeSettingValue(record);
	}
}

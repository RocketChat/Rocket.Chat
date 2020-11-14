import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { api } from '../../../../server/sdk/api';
import { IEnterpriseSettings } from '../../../../server/sdk/types/IEnterpriseSettings';
import { changeSettingValue } from './settings';
import { ISetting } from '../../../../definition/ISetting';

class EnterpriseSettings extends ServiceClass implements IEnterpriseSettings {
	protected name = 'ee-settings';

	protected internal = true;

	changeSettingValue(record: ISetting): undefined | { value: ISetting['value'] } {
		return changeSettingValue(record);
	}
}

api.registerService(new EnterpriseSettings());

import { IServiceClass } from './ServiceClass';
import { ISetting } from '../../../definition/ISetting';

export interface IEnterpriseSettings extends IServiceClass {
	changeSettingValue(record: ISetting): undefined | { value: ISetting['value'] };
}

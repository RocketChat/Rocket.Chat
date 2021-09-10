import { settings } from '../../../app/settings/server';
import type { SettingValue } from '../../../definition/ISetting';

export function getLDAPConditionalSetting(settingName: string): SettingValue {
	const isActiveDirectory = settings.getAs<string>('LDAP_Server_Type') === 'ad';
	const key = isActiveDirectory ? settingName.replace('LDAP_', 'LDAP_AD_') : settingName;
	return settings.get(key) as unknown as SettingValue;
}

import { settings } from '../../../app/settings/server';
import type { SettingValue } from '../../../definition/ISetting';

export function getLDAPConditionalSetting<T extends SettingValue = SettingValue>(settingName: string): T | undefined {
	const isActiveDirectory = settings.get<string>('LDAP_Server_Type') === 'ad';
	const key = isActiveDirectory ? settingName.replace('LDAP_', 'LDAP_AD_') : settingName;
	return settings.get<T>(key);
}

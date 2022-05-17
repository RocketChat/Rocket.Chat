export const getSettingPermissionId = function <T extends string>(settingId: T): `change-setting-${T}` {
	// setting-based permissions
	return `change-setting-${settingId}`;
};

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
};

export { AuthorizationUtils } from './AuthorizationUtils';

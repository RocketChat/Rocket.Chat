export const getSettingPermissionId = function (settingId) {
	// setting-based permissions
	return `change-setting-${settingId}`;
};

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
};

export { AuthorizationUtils } from './AuthorizationUtils';

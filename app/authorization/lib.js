export const getSettingPermissionId = function(settingId) {
	// setting-based permissions
	return `change-setting-${ settingId }`;
};

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
};

export const AuthorizationUtils = class {
	static isRoleReadOnly(/* roleId */) {
		return false;
	}
};

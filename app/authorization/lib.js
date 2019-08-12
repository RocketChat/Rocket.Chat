export const getSettingPermissionId = function(settingId) {
	// setting-based permissions
	return `change-setting-${ settingId }`;
};

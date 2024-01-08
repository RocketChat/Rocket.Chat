import type { ISetting } from '@rocket.chat/core-typings';

export const getSettingPermissionId = function (settingId: ISetting['_id']) {
	// setting-based permissions
	return `change-setting-${settingId}`;
};

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
} as const;

export { AuthorizationUtils } from './AuthorizationUtils';

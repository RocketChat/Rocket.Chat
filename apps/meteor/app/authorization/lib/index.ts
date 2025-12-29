import type { IPermission, ISetting } from '@rocket.chat/core-typings';

// setting-based permissions
export const getSettingPermissionId = (settingId: ISetting['_id']) => `change-setting-${settingId}` as const;

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
} as const;

export const confirmationRequiredPermissions: IPermission['_id'][] = ['access-permissions'];

export { AuthorizationUtils } from './AuthorizationUtils';

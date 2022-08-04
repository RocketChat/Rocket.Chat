export function getSettingPermissionId(settingId: string): string {
	// setting-based permissions
	return `change-setting-${settingId}`;
}

export const CONSTANTS = {
	SETTINGS_LEVEL: 'settings',
} as const;

export { AuthorizationUtils } from './AuthorizationUtils';

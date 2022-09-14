export const ADMIN_PERMISSIONS = [
	'view-logs',
	'manage-emoji',
	'manage-sounds',
	'view-statistics',
	'manage-oauth-apps',
	'view-privileged-setting',
	'manage-selected-settings',
	'view-room-administration',
	'view-user-administration',
	'access-setting-permissions',
	'manage-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-outgoing-integrations',
	'manage-own-incoming-integrations',
	'view-engagement-dashboard',
];
export const SETTINGS_PERMISSIONS = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];
export const AUDIT_PERMISSIONS = ['can-audit'];
export const AUDIT_LOG_PERMISSIONS = ['can-audit-log'];
export const MANAGE_APPS_PERMISSIONS = ['manage-apps'];

export const ADMINISTRATION_MENU_PERMISSIONS = [
	...ADMIN_PERMISSIONS,
	...MANAGE_APPS_PERMISSIONS,
	...SETTINGS_PERMISSIONS,
	...AUDIT_PERMISSIONS,
	...AUDIT_LOG_PERMISSIONS,
];
export const AUDIT_MENU_PERMISSIONS = [...AUDIT_PERMISSIONS, ...AUDIT_LOG_PERMISSIONS];

export const AUDIT_LICENSE_MODULE = 'auditing';

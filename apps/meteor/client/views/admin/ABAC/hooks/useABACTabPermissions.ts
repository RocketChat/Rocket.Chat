import { usePermission } from '@rocket.chat/ui-contexts';

export type ABACTab = 'settings' | 'room-attributes' | 'rooms' | 'logs';

export const ABAC_TAB_ORDER: ABACTab[] = ['settings', 'room-attributes', 'rooms', 'logs'];

export const useABACTabPermissions = (): Record<ABACTab, boolean> => {
	return {
		'settings': usePermission('manage-abac-admin-settings'),
		'room-attributes': usePermission('manage-abac-admin-room-attributes'),
		'rooms': usePermission('manage-abac-admin-rooms'),
		'logs': usePermission('view-abac-admin-audit'),
	};
};

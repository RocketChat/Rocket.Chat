import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IPermission extends IRocketChatRecord {
	roles: string[];
	group?: string;
	groupPermissionId?: string;
	level?: 'settings';
	section?: string;
	sectionPermissionId?: string;
	settingId?: string;
	sorter?: number;
}

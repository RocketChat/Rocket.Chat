import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IPermission extends IRocketChatRecord {
	roles: string[];
	group?: string;
	section?: string;
	groupPermissionId?: string;
	level?: 'settings';
	sectionPermissionId?: string;
	settingId?: string;
	sorter?: number;
}

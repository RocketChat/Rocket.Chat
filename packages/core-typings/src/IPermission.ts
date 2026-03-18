export interface IPermission {
	_id: string;
	_updatedAt: Date;
	roles: string[];
	group?: string;
	section?: string;
	groupPermissionId?: string;
	level?: 'settings';
	sectionPermissionId?: string;
	settingId?: string;
	sorter?: number;
}

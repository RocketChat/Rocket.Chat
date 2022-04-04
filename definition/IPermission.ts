export interface IPermission {
	_id: string;
	_updatedAt?: Date;
	roles: string[];
	group?: string;
	groupPermissionId?: string;
	level?: 'settings';
	section?: string;
	sectionPermissionId?: string;
	settingId?: string;
	sorter?: number;
}

import type { IPermission, IRole } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPermissionsModel extends IBaseModel<IPermission> {
	createOrUpdate(name: string, roles: IRole['_id'][]): Promise<IPermission['_id']>;
	create(id: string, roles: IRole['_id'][]): Promise<IPermission['_id']>;
	addRole(permission: string, role: IRole['_id']): Promise<void>;
	setRoles(permission: string, roles: IRole['_id'][]): Promise<void>;
	removeRole(permission: string, role: IRole['_id']): Promise<void>;
	findByLevel(level: 'settings', settingId?: string): FindCursor<IPermission>;
}

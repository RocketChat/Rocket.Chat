import type { IPermission, IRole } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IPermissionsModel extends IBaseModel<IPermission> {
	createOrUpdate(name: IPermission['_id'], roles: IRole['_id'][]): Promise<IPermission['_id']>;
	create(id: IPermission['_id'], roles: IRole['_id'][]): Promise<IPermission['_id']>;
	addRole(permission: IPermission['_id'], role: IRole['_id']): Promise<void>;
	setRoles(permission: IPermission['_id'], roles: IRole['_id'][]): Promise<void>;
	removeRole(permission: IPermission['_id'], role: IRole['_id']): Promise<void>;
	findByLevel(level: 'settings', settingId?: string): FindCursor<IPermission>;
}

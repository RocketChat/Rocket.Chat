import type { IAppRolesConverter } from '@rocket.chat/apps';
import type { IRole as AppsEngineRole } from '@rocket.chat/apps-engine/definition/roles';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppRolesConverter implements IAppRolesConverter {
	async convertById(roleId: string): Promise<AppsEngineRole | undefined> {
		const role = await Roles.findOneById(roleId);

		if (!role) {
			return;
		}
		return this.convertRole(role);
	}

	async convertRole(role: IRole): Promise<AppsEngineRole> {
		const map = {
			id: '_id',
			name: 'name',
			description: 'description',
			mandatory2fa: 'mandatory2fa',
			protected: 'protected',
			scope: 'scope',
		} as const;

		return transformMappedData(role, map);
	}
}

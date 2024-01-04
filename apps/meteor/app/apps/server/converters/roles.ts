import type { IRole as AppsEngineRole } from '@rocket.chat/apps-engine/definition/roles';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

import { transformMappedData } from '../../../../ee/lib/misc/transformMappedData';

export class AppRolesConverter {
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
		};

		return (await transformMappedData(role, map)) as unknown as AppsEngineRole;
	}
}

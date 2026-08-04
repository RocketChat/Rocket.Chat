import type { IAppRolesConverter } from '@rocket.chat/apps';
import type { IRole as AppsEngineRole } from '@rocket.chat/apps-engine/definition/roles';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';
import * as z from 'zod';

import { RoleCodec } from './codecs';

export class AppRolesConverter implements IAppRolesConverter {
	async convertById(roleId: string): Promise<AppsEngineRole | undefined> {
		const role = await Roles.findOneById(roleId);

		if (!role) {
			return;
		}
		return this.convertRole(role);
	}

	async convertRole(role: IRole): Promise<AppsEngineRole> {
		return z.decode(RoleCodec, role) as unknown as AppsEngineRole;
	}
}

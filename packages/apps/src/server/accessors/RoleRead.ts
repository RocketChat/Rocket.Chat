import type { IRoleRead } from '@rocket.chat/apps-engine/definition/accessors/IRoleRead';
import type { IRole } from '@rocket.chat/apps-engine/definition/roles';

import type { RoleBridge } from '../bridges';

export class RoleRead implements IRoleRead {
	constructor(
		private roleBridge: RoleBridge,
		private appId: string,
	) {}

	public getOneByIdOrName(idOrName: string): Promise<IRole | null> {
		return this.roleBridge.doGetOneByIdOrName(idOrName, this.appId);
	}

	public getCustomRoles(): Promise<Array<IRole>> {
		return this.roleBridge.doGetCustomRoles(this.appId);
	}
}

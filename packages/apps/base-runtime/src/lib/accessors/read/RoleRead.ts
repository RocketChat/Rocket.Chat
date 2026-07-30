import type { IRoleRead } from '@rocket.chat/apps-engine/definition/accessors/IRoleRead';
import type { IRole } from '@rocket.chat/apps-engine/definition/roles';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class RoleRead implements IRoleRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getOneByIdOrName(idOrName: string): Promise<IRole | null> {
		return this.bridges.getRoleBridge().doGetOneByIdOrName(idOrName, 'APP_ID') as Promise<IRole | null>;
	}

	public getCustomRoles(): Promise<Array<IRole>> {
		return this.bridges.getRoleBridge().doGetCustomRoles('APP_ID') as Promise<Array<IRole>>;
	}
}

import { RoleBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

export class AppRoleBridge extends RoleBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getOneByIdOrName(idOrName: IRole['_id'] | IRole['name'], appId: string): Promise<IRole | null> {
		this.orch.debugLog(`The App ${appId} is getting the roleByIdOrName: "${idOrName}"`);

		const role = await Roles.findOneByIdOrName(idOrName);
		return role;
	}

	protected async getCustomRoles(appId: string): Promise<Array<IRole>> {
		this.orch.debugLog(`The App ${appId} is getting the custom roles`);

		const cursor = Roles.findCustomRoles();

		const roles = await cursor.toArray();
		return roles;
	}
}

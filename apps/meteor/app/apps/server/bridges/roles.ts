import type { IRole } from '@rocket.chat/apps-engine/definition/roles';
import { RoleBridge } from '@rocket.chat/apps-engine/server/bridges';
import { Roles } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

export class AppRoleBridge extends RoleBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null> {
		this.orch.debugLog(`The App ${appId} is getting the roleByIdOrName: "${idOrName}"`);

		const role = await Roles.findOneByIdOrName(idOrName);
		return this.orch.getConverters()?.get('roles').convertRole(role);
	}

	protected async getCustomRoles(appId: string): Promise<Array<IRole>> {
		this.orch.debugLog(`The App ${appId} is getting the custom roles`);

		const cursor = Roles.findCustomRoles();

		const roles: IRole[] = [];

		for await (const role of cursor) {
			const convRole = await this.orch.getConverters()?.get('roles').convertRole(role);
			roles.push(convRole);
		}

		return roles;
	}
}

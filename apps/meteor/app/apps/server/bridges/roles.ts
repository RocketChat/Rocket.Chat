import type { IAppServerOrchestrator, IAppsRole } from '@rocket.chat/apps';
import { RoleBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

export class AppRoleBridge extends RoleBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getOneByIdOrName(idOrName: IAppsRole['id'] | IAppsRole['name'], appId: string): Promise<IAppsRole | null> {
		this.orch.debugLog(`The App ${appId} is getting the roleByIdOrName: "${idOrName}"`);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const role: IRole | null = await Roles.findOneByIdOrName(idOrName);
		return this.orch
			.getConverters()
			?.get('roles')
			.convertRole(role as IRole);
	}

	protected async getCustomRoles(appId: string): Promise<Array<IAppsRole>> {
		this.orch.debugLog(`The App ${appId} is getting the custom roles`);

		const cursor = Roles.findCustomRoles();

		const roles: IAppsRole[] = [];

		for await (const role of cursor) {
			const convRole = await this.orch.getConverters()?.get('roles').convertRole(role);
			roles.push(convRole);
		}

		return roles;
	}
}

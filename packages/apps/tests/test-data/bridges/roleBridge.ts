import type { IRole } from '@rocket.chat/apps-engine/definition/roles/index.js';

import { RoleBridge } from '../../../src/server/bridges/index.js';

export class TestsRoleBridge extends RoleBridge {
	public getOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null> {
		throw new Error('Method not implemented.');
	}

	public getCustomRoles(appId: string): Promise<Array<IRole>> {
		throw new Error('Method not implemented.');
	}
}

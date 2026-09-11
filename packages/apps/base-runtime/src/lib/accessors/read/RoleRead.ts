import type { IRoleRead } from '@rocket.chat/apps-engine/definition/accessors/IRoleRead';
import type { IRole } from '@rocket.chat/apps-engine/definition/roles';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class RoleRead implements IRoleRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getOneByIdOrName(idOrName: string): Promise<IRole | null> {
		return bridgeCall<IRole | null>(this.senderFn, 'getRoleBridge', 'doGetOneByIdOrName', idOrName, 'APP_ID');
	}

	public getCustomRoles(): Promise<Array<IRole>> {
		return bridgeCall<Array<IRole>>(this.senderFn, 'getRoleBridge', 'doGetCustomRoles', 'APP_ID');
	}
}

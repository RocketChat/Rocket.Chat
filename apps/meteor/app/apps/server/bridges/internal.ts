import type { IAppServerOrchestrator, IAppsSetting } from '@rocket.chat/apps';
import { InternalBridge } from '@rocket.chat/apps-engine/server/bridges/InternalBridge';
import type { ISetting, ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions, WorkspaceCredentials } from '@rocket.chat/models';

import { isTruthy } from '../../../../lib/isTruthy';
import { deasyncPromise } from '../../../../server/deasync/deasync';

export class AppInternalBridge extends InternalBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected getUsernamesOfRoomByIdSync(roomId: string): Array<string> {
		return deasyncPromise(this.getUsernamesOfRoomById(roomId));
	}

	protected async getUsernamesOfRoomById(roomId: string): Promise<Array<string>> {
		// This function will be converted to sync inside the apps-engine code
		// TODO: Track Deprecation

		if (!roomId) {
			return [];
		}

		const records = await Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
			projection: {
				'u.username': 1,
			},
		}).toArray();

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s: ISubscription) => s.u.username).filter(isTruthy);
	}

	protected async getWorkspacePublicKey(): Promise<IAppsSetting> {
		const publicKeySetting = await WorkspaceCredentials.getCredentialById('workspace_public_key');

		if (!publicKeySetting) {
			throw new Error('Public Key not found');
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		return this.orch
			.getConverters()
			?.get('settings')
			.convertToApp(publicKeySetting.value as unknown as ISetting);
	}
}

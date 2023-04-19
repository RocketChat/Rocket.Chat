import { InternalBridge } from '@rocket.chat/apps-engine/server/bridges/InternalBridge';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { ISubscription } from '@rocket.chat/core-typings';
import { Settings, Subscriptions } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { isTruthy } from '../../../../lib/isTruthy';

export class AppInternalBridge extends InternalBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected getUsernamesOfRoomById(roomId: string): Array<string> {
		if (!roomId) {
			return [];
		}

		// Depends on apps engine separation to microservices
		const records = Promise.await(
			Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
				projection: {
					'u.username': 1,
				},
			}).toArray(),
		);

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s: ISubscription) => s.u.username).filter(isTruthy);
	}

	protected async getWorkspacePublicKey(): Promise<ISetting> {
		const publicKeySetting = await Settings.findOneById('Cloud_Workspace_PublicKey');

		return this.orch.getConverters()?.get('settings').convertToApp(publicKeySetting);
	}
}

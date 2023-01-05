import { InternalBridge } from '@rocket.chat/apps-engine/server/bridges/InternalBridge';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { ISubscription } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../orchestrator';
import { Subscriptions } from '../../../models/server';

export class AppInternalBridge extends InternalBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected getUsernamesOfRoomById(roomId: string): Array<string> {
		if (!roomId) {
			return [];
		}

		const records = Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
			fields: {
				'u.username': 1,
			},
		}).fetch();

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s: ISubscription) => s.u.username);
	}

	protected async getWorkspacePublicKey(): Promise<ISetting> {
		const publicKeySetting = await Settings.findOneById('Cloud_Workspace_PublicKey');

		return this.orch.getConverters()?.get('settings').convertToApp(publicKeySetting);
	}
}

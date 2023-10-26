import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { InternalBridge } from '@rocket.chat/apps-engine/server/bridges/InternalBridge';
import type { ISubscription } from '@rocket.chat/core-typings';
import { Settings, Subscriptions } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { isTruthy } from '../../../../lib/isTruthy';
import { deasyncPromise } from '../../../../server/deasync/deasync';

export class AppInternalBridge extends InternalBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
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

	protected async getWorkspacePublicKey(): Promise<ISetting> {
		const publicKeySetting = await Settings.findOneById('Cloud_Workspace_PublicKey');

		return this.orch.getConverters()?.get('settings').convertToApp(publicKeySetting);
	}
}

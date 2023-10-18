import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import { BaseBridge } from '@rocket.chat/apps-engine/server/bridges/BaseBridge';
import { api } from '@rocket.chat/core-services';
import type { UiKit } from '@rocket.chat/core-typings';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

export class UiInteractionBridge extends BaseBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async notifyUser(user: IUser, interaction: UiKit.ServerInteraction, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is sending an interaction to user.`);

		const app = this.orch.getManager()?.getOneById(appId);

		if (!app) {
			throw new Error('Invalid app provided');
		}

		void api.broadcast('notify.uiInteraction', user.id, interaction);
	}
}

import { UiInteractionBridge as UiIntBridge } from '@rocket.chat/apps-engine/server/bridges/UiInteractionBridge';
import { IUIKitInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { api } from '../../../../server/sdk/api';
import { AppServerOrchestrator } from '../orchestrator';

export class UiInteractionBridge extends UiIntBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async notifyUser(user: IUser, interaction: IUIKitInteraction, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is sending an interaction to user.`);

		const app = this.orch.getManager()?.getOneById(appId);

		if (!app) {
			throw new Error('Invalid app provided');
		}

		api.broadcast('notify.uiInteraction', user.id, interaction);
	}
}

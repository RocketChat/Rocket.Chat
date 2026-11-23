import type { IUIKitInteractionParam } from '@rocket.chat/apps-engine/definition/accessors/IUIController.js';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/index.js';

import { UiInteractionBridge } from '../../../src/server/bridges/index.js';

export class TestsUiIntegrationBridge extends UiInteractionBridge {
	public async notifyUser(user: IUser, interaction: IUIKitInteractionParam, appId: string) {
		throw new Error('Method not implemented.');
	}
}

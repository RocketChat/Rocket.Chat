import type { IUIKitInteractionParam } from '@rocket.chat/apps-engine/definition/accessors/IUIController';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { UiInteractionBridge } from '../../../src/server/bridges';

export class TestsUiIntegrationBridge extends UiInteractionBridge {
	public async notifyUser(user: IUser, interaction: IUIKitInteractionParam, appId: string) {
		throw new Error('Method not implemented.');
	}
}

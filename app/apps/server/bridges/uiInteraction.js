import { Notifications } from '../../../notifications/server';

export class UiInteractionBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async notifyUser(user, interaction, appId) {
		this.orch.debugLog(`The App ${ appId } is sending an interaction to user.`);

		const app = this.orch.getManager().getOneById(appId);

		if (!app) {
			throw new Error('Invalid app provided');
		}

		Notifications.notifyUser(user.id, 'uiInteraction', interaction);
	}
}

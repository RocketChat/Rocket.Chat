import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { ExperimentalBridge } from '@rocket.chat/apps-engine/server/bridges';
import { Subscriptions } from '@rocket.chat/models';

export class AppExperimentalBridge extends ExperimentalBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getUserRoomIds(userId: string, appId: string): Promise<string[] | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the room ids for the user: "${userId}"`);

		const subscriptions = await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray();

		return subscriptions.map((subscription) => subscription.rid);
	}
}

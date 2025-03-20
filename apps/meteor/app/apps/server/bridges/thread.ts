import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { ThreadBridge } from '@rocket.chat/apps-engine/server/bridges/ThreadBridge';

export class AppThreadBridge extends ThreadBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(threadID: string, appId: string): Promise<IMessage[]> {
		this.orch.debugLog(`The App ${appId} is getting the thread: "${threadID}"`);

		return this.orch.getConverters()?.get('threads').convertById(threadID);
	}
}

import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { MediaCallBridge } from '@rocket.chat/apps/dist/server/bridges/MediaCallBridge';
import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls';
import { MediaCalls } from '@rocket.chat/models';

export class AppMediaCallBridge extends MediaCallBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<IMediaCall | null> {
		this.orch.debugLog(`The App ${appId} is getting the media call byId: "${callId}"`);

		return MediaCalls.findOneById(callId);
	}
}

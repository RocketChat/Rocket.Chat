import type { IAppServerOrchestrator, IAppsMediaCall } from '@rocket.chat/apps';
import { MediaCallBridge } from '@rocket.chat/apps/dist/server/bridges/MediaCallBridge';
import { MediaCalls } from '@rocket.chat/models';

import { toAppMediaCall } from '../converters/mediaCalls';

export class AppMediaCallBridge extends MediaCallBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<IAppsMediaCall | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the media call byId: "${callId}"`);

		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			return undefined;
		}

		return toAppMediaCall(call);
	}
}

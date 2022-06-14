import { VideoConferenceBridge } from '@rocket.chat/apps-engine/server/bridges/VideoConferenceBridge';
import { VideoConference as AppVideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders';

import { VideoConf } from '../../../../server/sdk';
import { AppServerOrchestrator } from '../orchestrator';
import { videoConfProviders } from '../../../../server/lib/videoConfProviders';
import type { AppVideoConferencesConverter } from '../converters/videoConferences';

export class AppVideoConferenceBridge extends VideoConferenceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<AppVideoConference> {
		this.orch.debugLog(`The App ${appId} is getting the video conference byId: "${callId}"`);

		return this.orch.getConverters()?.get('videoConferences').convertById(callId);
	}

	protected async update(call: AppVideoConference, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a video conference.`);

		const oldData = call._id && (await VideoConf.getUnfiltered(call._id));
		if (!oldData) {
			throw new Error('A video conference must exist to update.');
		}

		const data = (this.orch.getConverters()?.get('videoConferences') as AppVideoConferencesConverter).convertAppVideoConference(call);
		await VideoConf.setProviderData(call._id, data.providerData);

		if (data.status > oldData.status) {
			await VideoConf.setStatus(call._id, data.status);
		}

		if (data.endedBy && data.endedBy._id !== oldData.endedBy?._id) {
			await VideoConf.setEndedBy(call._id, data.endedBy._id);
		} else if (data.endedAt) {
			await VideoConf.setEndedAt(call._id, data.endedAt);
		}

		for (const { _id, ts } of data.users) {
			if (oldData.users.find((user) => user._id === _id)) {
				continue;
			}

			VideoConf.addUser(call._id, _id, ts);
		}
	}

	protected async registerProvider(info: IVideoConfProvider): Promise<void> {
		videoConfProviders.registerProvider(info.name);
	}

	protected async unRegisterProvider(info: IVideoConfProvider): Promise<void> {
		videoConfProviders.unRegisterProvider(info.name);
	}
}

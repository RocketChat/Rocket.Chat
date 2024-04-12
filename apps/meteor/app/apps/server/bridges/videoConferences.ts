import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { AppVideoConference, VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import { VideoConferenceBridge } from '@rocket.chat/apps-engine/server/bridges/VideoConferenceBridge';
import { VideoConf } from '@rocket.chat/core-services';

import { videoConfProviders } from '../../../../server/lib/videoConfProviders';
import type { AppVideoConferencesConverter } from '../converters/videoConferences';

export class AppVideoConferenceBridge extends VideoConferenceBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<VideoConference> {
		this.orch.debugLog(`The App ${appId} is getting the video conference byId: "${callId}"`);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const promise: Promise<VideoConference | undefined> = this.orch.getConverters()?.get('videoConferences').convertById(callId);
		return promise as Promise<VideoConference>;
	}

	protected async create(call: AppVideoConference, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a video conference.`);

		return (
			await VideoConf.create({
				type: 'videoconference',
				...call,
			})
		).callId;
	}

	protected async update(call: VideoConference, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a video conference.`);

		const oldData = call._id && (await VideoConf.getUnfiltered(call._id));
		if (!oldData) {
			throw new Error('A video conference must exist to update.');
		}

		const data = (this.orch.getConverters()?.get('videoConferences') as AppVideoConferencesConverter).convertAppVideoConference(call);
		await VideoConf.setProviderData(call._id, data.providerData);

		for await (const { _id, ts } of data.users) {
			if (oldData.users.find((user) => user._id === _id)) {
				continue;
			}

			await VideoConf.addUser(call._id, _id, ts);
		}

		if (data.endedBy && data.endedBy._id !== oldData.endedBy?._id) {
			await VideoConf.setEndedBy(call._id, data.endedBy._id);
		} else if (data.endedAt) {
			await VideoConf.setEndedAt(call._id, data.endedAt);
		}

		if (data.status > oldData.status) {
			await VideoConf.setStatus(call._id, data.status);
		}
	}

	protected async registerProvider(info: IVideoConfProvider, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is registering a video conference provider.`);
		videoConfProviders.registerProvider(info.name, info.capabilities || {}, appId);
	}

	protected async unRegisterProvider(info: IVideoConfProvider): Promise<void> {
		videoConfProviders.unRegisterProvider(info.name);
	}
}

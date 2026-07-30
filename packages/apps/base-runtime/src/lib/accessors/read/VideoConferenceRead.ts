import type { IVideoConferenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class VideoConferenceRead implements IVideoConferenceRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(id: string): Promise<VideoConference> {
		return this.bridges.getVideoConferenceBridge().doGetById(id, 'APP_ID') as Promise<VideoConference>;
	}
}

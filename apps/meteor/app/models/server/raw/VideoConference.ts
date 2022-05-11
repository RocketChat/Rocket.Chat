import { IVideoConference } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<IVideoConference> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1, status: 1, createdAt: 1 }, unique: false }];
	}
}

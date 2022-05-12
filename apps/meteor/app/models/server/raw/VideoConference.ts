import { IVideoConference } from '@rocket.chat/core-typings';
import { UpdateOneOptions, UpdateQuery, UpdateWriteOpResult } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<IVideoConference> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1, status: 1, createdAt: 1 }, unique: false }];
	}

	public updateOneById(
		_id: string,
		update: UpdateQuery<IVideoConference> | Partial<IVideoConference>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, update, options);
	}
}

import type { IMediaCallChannelLog, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMediaCallChannelLogsModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallChannelLogsRaw extends BaseRaw<IMediaCallChannelLog> implements IMediaCallChannelLogsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCallChannelLog>>) {
		super(db, 'media_call_channel_logs', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: { callId: 1, channelId: 1 },
				unique: false,
			},
			// Allow 3 days of events to be saved
			{ key: { ts: 1 }, expireAfterSeconds: 3 * 24 * 60 * 60 },
		];
	}
}

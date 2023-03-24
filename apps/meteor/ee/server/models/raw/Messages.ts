import type { Db } from 'mongodb';
import type { IUser } from '@rocket.chat/core-typings';

import { MessagesRaw } from '../../../../server/models/raw/Messages';

export class MessagesEE extends MessagesRaw {
	constructor(db: Db) {
		super(db);
	}

	async createOnHoldHistoryWithRoomIdMessageAndUser(
		roomId: string,
		comment: string,
		user: Pick<IUser, 'username' | '_id'>,
	): Promise<
		{ t: string; rid: string; ts: Date; comment: string; u: { _id: string; username: string | undefined }; groupable: boolean } & {
			_id: string;
		}
	> {
		const type = 'omnichannel_placed_chat_on_hold' as const;
		const record = {
			t: type,
			rid: roomId,
			ts: new Date(),
			comment,
			u: {
				_id: user._id,
				username: user.username || '',
			},
			groupable: false as const,
		};

		const _id = (await this.updateOne(record, { $set: record }, { upsert: true })).upsertedId as unknown as string;
		return Object.assign(record, { _id });
	}

	async createOnHoldResumedHistoryWithRoomIdMessageAndUser(
		roomId: string,
		comment: string,
		user: Pick<IUser, 'username' | '_id'>,
	): Promise<
		{ t: string; rid: string; ts: Date; comment: string; u: { _id: string; username: string | undefined }; groupable: boolean } & {
			_id: string;
		}
	> {
		const type = 'omnichannel_on_hold_chat_resumed' as const;
		const record = {
			t: type,
			rid: roomId,
			ts: new Date(),
			comment,
			u: {
				_id: user._id,
				username: user.username || '',
			},
			groupable: false as const,
		};

		const _id = (await this.updateOne(record, { $set: record }, { upsert: true })).upsertedId as unknown as string;
		return Object.assign(record, { _id });
	}

	async createTransferFailedHistoryMessage(
		rid: string,
		comment: string,
		user: Pick<IUser, '_id' | 'username'>,
		extraData: Record<string, any> = {},
	): Promise<
		{ t: string; rid: string; ts: Date; comment: string; u: { _id: string; username: string | undefined }; groupable: boolean } & {
			_id: string;
		}
	> {
		const t = 'livechat_transfer_history_fallback' as const;
		const record = {
			t,
			rid,
			ts: new Date(),
			comment,
			u: {
				_id: user._id,
				username: user.username || '',
			},
			groupable: false as const,
		};

		Object.assign(record, extraData);

		const _id = (await this.updateOne(record, { $set: record }, { upsert: true })).upsertedId as unknown as string;
		return Object.assign(record, { _id });
	}
}

import type { Db, Collection } from 'mongodb';
import type { IUser, RocketChatRecordDeleted, IMessage } from '@rocket.chat/core-typings';

import { MessagesRaw } from '../../../../server/models/raw/Messages';

type ISysMessageResult = {
	t: string;
	rid: string;
	ts: Date;
	comment: string;
	u: {
		_id: string;
		username: string | undefined;
	};
	groupable: boolean;
} & {
	_id: string;
};

declare module '@rocket.chat/model-typings' {
	interface IMessagesModel {
		createOnHoldHistoryWithRoomIdMessageAndUser(
			roomId: string,
			comment: string,
			user: Pick<IUser, 'username' | '_id'>,
		): Promise<ISysMessageResult>;
		createOnHoldResumedHistoryWithRoomIdMessageAndUser(
			roomId: string,
			comment: string,
			user: Pick<IUser, 'username' | '_id'>,
		): Promise<ISysMessageResult>;
		createTransferFailedHistoryMessage(
			rid: string,
			comment: string,
			user: Pick<IUser, '_id' | 'username'>,
			extraData?: Record<string, any>,
		): Promise<ISysMessageResult>;
	}
}

export class MessagesEE extends MessagesRaw {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMessage>>) {
		super(db, trash);
	}

	async createOnHoldHistoryWithRoomIdMessageAndUser(
		roomId: string,
		comment: string,
		user: Pick<IUser, 'username' | '_id'>,
	): Promise<ISysMessageResult> {
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
	): Promise<ISysMessageResult> {
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
	): Promise<ISysMessageResult> {
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

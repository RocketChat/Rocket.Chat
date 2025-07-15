import type { IMatrixBridgedMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixBridgedMessageModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixBridgedMessageRaw extends BaseRaw<IMatrixBridgedMessage> implements IMatrixBridgedMessageModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixBridgedMessage>>) {
		super(db, 'matrix_bridged_messages', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { mid: 1 }, unique: true, sparse: true },
			{ key: { meid: 1 }, unique: true, sparse: true },
		];
	}

	async getExternalEventId(localMessageId: string): Promise<string | null> {
		const bridgedMessage = await this.findOne({ mid: localMessageId });
		return bridgedMessage ? bridgedMessage.meid : null;
	}

	async getLocalMessageId(externalEventId: string): Promise<string | null> {
		const bridgedMessage = await this.findOne({ meid: externalEventId });
		return bridgedMessage ? bridgedMessage.mid : null;
	}

	async createOrUpdate(localMessageId: string, externalEventId: string): Promise<void> {
		await this.updateOne({ mid: localMessageId }, { $set: { mid: localMessageId, meid: externalEventId } }, { upsert: true });
	}

	async removeByLocalMessageId(localMessageId: string): Promise<void> {
		await this.deleteOne({ mid: localMessageId });
	}
}

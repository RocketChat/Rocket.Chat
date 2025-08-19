import type {
	IImportChannelRecord,
	IImportMessageRecord,
	IImportRecord,
	IImportUserRecord,
	IImportContactRecord,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { IImportDataModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ImportDataRaw extends BaseRaw<IImportRecord> implements IImportDataModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IImportRecord>>) {
		super(db, 'import_data', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { dataType: 1 } }];
	}

	getAllUsers(): FindCursor<IImportUserRecord> {
		return this.find({ dataType: 'user' }) as FindCursor<IImportUserRecord>;
	}

	getAllMessages(): FindCursor<IImportMessageRecord> {
		return this.find({ dataType: 'message' }) as FindCursor<IImportMessageRecord>;
	}

	getAllChannels(): FindCursor<IImportChannelRecord> {
		return this.find({ dataType: 'channel' }) as FindCursor<IImportChannelRecord>;
	}

	getAllUsersForSelection(): Promise<Array<IImportUserRecord>> {
		return this.find<IImportUserRecord>(
			{
				dataType: 'user',
			},
			{
				projection: {
					'data.importIds': 1,
					'data.username': 1,
					'data.emails': 1,
					'data.deleted': 1,
					'data.type': 1,
				},
			},
		).toArray();
	}

	getAllChannelsForSelection(): Promise<Array<IImportChannelRecord>> {
		return this.find<IImportChannelRecord>(
			{
				'dataType': 'channel',
				'data.t': {
					$ne: 'd',
				},
			},
			{
				projection: {
					'data.importIds': 1,
					'data.name': 1,
					'data.archived': 1,
					'data.t': 1,
				},
			},
		).toArray();
	}

	getAllContactsForSelection(): Promise<IImportContactRecord[]> {
		return this.find<IImportContactRecord>(
			{
				dataType: 'contact',
			},
			{
				projection: {
					'data.importIds': 1,
					'data.name': 1,
					'data.phones': 1,
					'data.emails': 1,
				},
			},
		).toArray();
	}

	async checkIfDirectMessagesExists(): Promise<boolean> {
		return (
			(await this.countDocuments({
				'dataType': 'channel',
				'data.t': 'd',
			})) > 0
		);
	}

	async countMessages(): Promise<number> {
		return this.countDocuments({ dataType: 'message' });
	}

	async findChannelImportIdByNameOrImportId(channelIdentifier: string): Promise<string | undefined> {
		const channel = await this.findOne<IImportChannelRecord>(
			{
				dataType: 'channel',
				$or: [
					{
						'data.name': channelIdentifier,
					},
					{
						'data.importIds': channelIdentifier,
					},
				],
			},
			{
				projection: {
					'data.importIds': 1,
				},
			},
		);

		return channel?.data?.importIds?.shift();
	}
}

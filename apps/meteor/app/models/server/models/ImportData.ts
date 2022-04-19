import type { IImportUserRecord, IImportChannelRecord } from '@rocket.chat/core-typings';

import { Base } from './_Base';

class ImportDataModel extends Base {
	constructor() {
		super('import_data');
	}

	getAllUsersForSelection(): Array<IImportUserRecord> {
		return this.find(
			{
				dataType: 'user',
			},
			{
				fields: {
					'data.importIds': 1,
					'data.username': 1,
					'data.emails': 1,
					'data.deleted': 1,
					'data.type': 1,
				},
			},
		).fetch();
	}

	getAllChannelsForSelection(): Array<IImportChannelRecord> {
		return this.find(
			{
				'dataType': 'channel',
				'data.t': {
					$ne: 'd',
				},
			},
			{
				fields: {
					'data.importIds': 1,
					'data.name': 1,
					'data.archived': 1,
					'data.t': 1,
				},
			},
		).fetch();
	}

	checkIfDirectMessagesExists(): boolean {
		return (
			this.find(
				{
					'dataType': 'channel',
					'data.t': 'd',
				},
				{
					fields: {
						_id: 1,
					},
				},
			).count() > 0
		);
	}

	countMessages(): number {
		return this.find({
			dataType: 'message',
		}).count();
	}

	findChannelImportIdByNameOrImportId(channelIdentifier: string): string | undefined {
		const channel = this.findOne(
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
				fields: {
					'data.importIds': 1,
				},
			},
		);

		return channel?.data?.importIds?.shift();
	}

	findDMForImportedUsers(...users: Array<string>): IImportChannelRecord | undefined {
		const query = {
			'dataType': 'channel',
			'data.users': {
				$all: users,
			},
		};

		return this.findOne(query);
	}
}

export default new ImportDataModel();

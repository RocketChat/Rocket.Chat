import { Base } from '../../../models/server';
import { IImportUserRecord, IImportChannelRecord } from '../definitions/IImportRecord';

class ImportDataModel extends Base {
	constructor() {
		super('import_data');
	}

	getAllUsersForSelection(): Array<IImportUserRecord> {
		return this.find({
			dataType: 'user',
		}, {
			fields: {
				'data.importIds': 1,
				'data.username': 1,
				'data.emails': 1,
				'data.deleted': 1,
				'data.type': 1,
			},
		}).fetch();
	}

	getAllChannelsForSelection(): Array<IImportChannelRecord> {
		return this.find({
			dataType: 'channel',
			'data.t': {
				$ne: 'd',
			},
		}, {
			fields: {
				'data.importIds': 1,
				'data.name': 1,
				'data.archived': 1,
				'data.t': 1,
			},
		}).fetch();
	}

	checkIfDirectMessagesExists(): boolean {
		return this.find({
			dataType: 'channel',
			'data.t': 'd',
		}, {
			fields: {
				_id: 1,
			},
		}).count() > 0;
	}

	countMessages(): number {
		return this.find({
			dataType: 'message',
		}).count();
	}
}

export const ImportData = new ImportDataModel();

import type {
	IImportChannelRecord,
	IImportMessageRecord,
	IImportRecord,
	IImportUserRecord,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { IImportDataModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ImportDataRaw extends BaseRaw<IImportRecord> implements IImportDataModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IImportRecord>>) {
		super(db, 'import_data', trash);
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
}

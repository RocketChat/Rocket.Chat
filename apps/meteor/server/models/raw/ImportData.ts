import type {
	IImportChannelRecord,
	IImportMessageRecord,
	IImportRecord,
	IImportUserRecord,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { IImportDataModel } from '@rocket.chat/model-typings';
import type { Collection, Cursor, Db } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class ImportDataRaw extends BaseRaw<IImportRecord> implements IImportDataModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IImportRecord>>) {
		super(db, getCollectionName('import_data'), trash);
	}

	getAllUsers(): Cursor<IImportUserRecord> {
		return this.find({ dataType: 'user' }) as Cursor<IImportUserRecord>;
	}

	getAllMessages(): Cursor<IImportMessageRecord> {
		return this.find({ dataType: 'message' }) as Cursor<IImportMessageRecord>;
	}

	getAllChannels(): Cursor<IImportChannelRecord> {
		return this.find({ dataType: 'channel' }) as Cursor<IImportChannelRecord>;
	}
}

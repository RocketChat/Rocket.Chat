import { Cursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IImportRecord, IImportUserRecord, IImportMessageRecord, IImportChannelRecord } from '../../../../definition/IImportRecord';

export class ImportDataRaw extends BaseRaw<IImportRecord> {
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

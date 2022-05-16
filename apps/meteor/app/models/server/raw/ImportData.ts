import { Cursor } from 'mongodb';
import type { IImportRecord, IImportUserRecord, IImportMessageRecord, IImportChannelRecord } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

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

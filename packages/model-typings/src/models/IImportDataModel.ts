import type { Cursor } from 'mongodb';
import type { IImportRecord, IImportUserRecord, IImportMessageRecord, IImportChannelRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IImportDataModel extends IBaseModel<IImportRecord> {
	getAllUsers(): Cursor<IImportUserRecord>;
	getAllMessages(): Cursor<IImportMessageRecord>;
	getAllChannels(): Cursor<IImportChannelRecord>;
}

import type { FindCursor } from 'mongodb';
import type { IImportRecord, IImportUserRecord, IImportMessageRecord, IImportChannelRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IImportDataModel extends IBaseModel<IImportRecord> {
	getAllUsers(): FindCursor<IImportUserRecord>;
	getAllMessages(): FindCursor<IImportMessageRecord>;
	getAllChannels(): FindCursor<IImportChannelRecord>;
}

import type { Cursor } from 'mongodb';
import type { IImportRecord, IImportUserRecord, IImportMessageRecord, IImportChannelRecord } from '@rocket.chat/core-typings';
import type { IImportDataModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import ImportDataModel from '../../app/models/server/models/ImportData';

export class ImportData extends ModelClass<IImportRecord> implements IImportDataModel {
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

registerModel('IImportDataModel', new ImportData(ImportDataModel.model.rawCollection(), trashCollection) as IImportDataModel);

import type {
	IImportRecord,
	IImportUserRecord,
	IImportMessageRecord,
	IImportContactRecord,
	IImportChannelRecord,
} from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IImportDataModel extends IBaseModel<IImportRecord> {
	getAllUsers(): FindCursor<IImportUserRecord>;
	getAllMessages(): FindCursor<IImportMessageRecord>;
	getAllChannels(): FindCursor<IImportChannelRecord>;
	getAllUsersForSelection(): Promise<Array<IImportUserRecord>>;
	getAllChannelsForSelection(): Promise<Array<IImportChannelRecord>>;
	getAllContactsForSelection(): Promise<IImportContactRecord[]>;
	checkIfDirectMessagesExists(): Promise<boolean>;
	countMessages(): Promise<number>;
	findChannelImportIdByNameOrImportId(channelIdentifier: string): Promise<string | undefined>;
}

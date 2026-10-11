import type { IImportRecord, IImportUserRecord, IImportContactRecord, IImportChannelRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IImportDataModel extends IBaseModel<IImportRecord> {
	getAllUsersForSelection(): Promise<Array<IImportUserRecord>>;
	getAllChannelsForSelection(): Promise<Array<IImportChannelRecord>>;
	getAllContactsForSelection(): Promise<IImportContactRecord[]>;
	checkIfDirectMessagesExists(): Promise<boolean>;
	countMessages(): Promise<number>;
	findChannelImportIdByNameOrImportId(channelIdentifier: string): Promise<string | undefined>;
}

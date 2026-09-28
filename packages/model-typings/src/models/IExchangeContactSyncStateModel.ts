import type { IExchangeContactSyncState, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

/** The fields that, when any of them changes, make a stored cursor unusable. */
export type ExchangeContactSyncIdentity = Pick<IExchangeContactSyncState, 'mailbox' | 'provider'>;

export interface IExchangeContactSyncStateModel extends IBaseModel<IExchangeContactSyncState> {
	findOneByUserIdAndFolder(uid: IUser['_id'], folderId: string): Promise<IExchangeContactSyncState | null>;
	findFolderIdsByUserId(uid: IUser['_id']): Promise<string[]>;
	hasFolderSyncedSince(uid: IUser['_id'], since: Date): Promise<boolean>;
	saveCursor(
		uid: IUser['_id'],
		folderId: string,
		identity: ExchangeContactSyncIdentity,
		cursor: string | undefined,
		lastSyncAt: Date,
	): Promise<UpdateResult>;
	setLastError(uid: IUser['_id'], folderId: string, identity: ExchangeContactSyncIdentity, lastError: string): Promise<UpdateResult>;
	clearCursor(uid: IUser['_id'], folderId: string): Promise<UpdateResult>;
	deleteByUserIdAndFolders(uid: IUser['_id'], folderIds: string[]): Promise<DeleteResult>;
}

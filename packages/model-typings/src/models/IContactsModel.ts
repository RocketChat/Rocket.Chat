import type { IContact, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

/** `source` is set by the model, so ingestion cannot write a record it would not be allowed to prune. */
export type ImportedContact = Omit<InsertionModel<IContact>, '_id' | 'source' | 'externalId' | 'folderId' | 'lastSyncAt'> & {
	externalId: string;
	folderId: string;
};

export type ContactBulkUpsertResult = { matchedCount: number; modifiedCount: number; upsertedCount: number };

export interface IContactsModel extends IBaseModel<IContact> {
	findByUserId(uid: IUser['_id'], options?: FindOptions<IContact>): FindCursor<IContact>;
	findByUserIdAndPhone(uid: IUser['_id'], e164: string): FindCursor<IContact>;
	searchByUserId(uid: IUser['_id'], term: string, limit: number): FindCursor<IContact>;
	bulkUpsertImported(contacts: ImportedContact[], lastSyncAt: Date): Promise<ContactBulkUpsertResult>;
	deleteImportedByExternalIds(uid: IUser['_id'], folderId: string, externalIds: string[]): Promise<DeleteResult>;
	deleteImportedOutsideSet(uid: IUser['_id'], folderId: string, keepExternalIds: string[]): Promise<DeleteResult>;
	deleteImportedByFolder(uid: IUser['_id'], folderId: string): Promise<DeleteResult>;
}

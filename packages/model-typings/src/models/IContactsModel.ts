import type { IContact, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export type ImportedContact = Omit<InsertionModel<IContact>, '_id' | 'source' | 'externalId' | 'folderId' | 'lastSyncAt'> & {
	externalId: string;
	folderId: string;
};

export type LocalContact = Omit<
	InsertionModel<IContact>,
	'_id' | 'source' | 'officeLocation' | 'categories' | 'externalId' | 'folderId' | 'lastSyncAt'
>;

export type LocalContactUpdate = Omit<LocalContact, 'uid'>;

export type ContactBulkUpsertResult = { matchedCount: number; modifiedCount: number; upsertedCount: number };

export interface IContactsModel extends IBaseModel<IContact> {
	findPaginatedByUserId(uid: IUser['_id'], text: string | undefined, options: FindOptions<IContact>): FindPaginated<FindCursor<IContact>>;
	findByUserIdAndPhone(uid: IUser['_id'], e164: string): FindCursor<IContact>;
	countImportedByUserId(uid: IUser['_id']): Promise<number>;
	createLocal(contact: LocalContact): Promise<IContact | null>;
	updateLocal(uid: IUser['_id'], contactId: IContact['_id'], contact: LocalContactUpdate): Promise<UpdateResult>;
	deleteLocal(uid: IUser['_id'], contactId: IContact['_id']): Promise<DeleteResult>;
	bulkUpsertImported(contacts: ImportedContact[], lastSyncAt: Date): Promise<ContactBulkUpsertResult>;
	deleteImportedByExternalIds(uid: IUser['_id'], folderId: string, externalIds: string[]): Promise<DeleteResult>;
	deleteImportedOutsideSet(uid: IUser['_id'], folderId: string, keepExternalIds: string[]): Promise<DeleteResult>;
	deleteImportedByFolder(uid: IUser['_id'], folderId: string): Promise<DeleteResult>;
}

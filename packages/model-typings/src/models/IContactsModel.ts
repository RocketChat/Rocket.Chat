import type { IContact, IContactPublic, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

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
	findPaginatedByUserId(
		uid: IUser['_id'],
		text: string | undefined,
		options: FindOptions<IContact>,
		source?: IContact['source'],
	): FindPaginated<FindCursor<IContact>>;
	findOneByUserIdAndPhone(
		uid: IUser['_id'],
		e164: string,
		source?: IContact['source'],
	): Promise<Pick<IContact, '_id' | 'displayName'> | null>;
	countImportedByUserId(uid: IUser['_id']): Promise<number>;
	createLocal(contact: LocalContact): Promise<IContactPublic | null>;
	updateLocal(uid: IUser['_id'], contactId: IContact['_id'], contact: LocalContactUpdate): Promise<UpdateResult>;
	deleteLocal(uid: IUser['_id'], contactId: IContact['_id']): Promise<DeleteResult>;
	bulkUpsertImported(contacts: ImportedContact[], lastSyncAt: Date): Promise<ContactBulkUpsertResult>;
	findImportedByFolder<P extends Document = IContact>(
		uid: IUser['_id'],
		folderId: string,
		externalIds?: { in: string[] } | { notIn: string[] },
		options?: FindOptions<P extends IContact ? IContact : P>,
	): FindCursor<P>;
	deleteImportedByExternalIds(uid: IUser['_id'], folderId: string, externalIds: string[]): Promise<DeleteResult>;
	deleteImportedOutsideSet(uid: IUser['_id'], folderId: string, keepExternalIds: string[]): Promise<DeleteResult>;
	deleteImportedByFolder(uid: IUser['_id'], folderId: string): Promise<DeleteResult>;
}

import type { IContact, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	ContactBulkUpsertResult,
	FindPaginated,
	IContactsModel,
	ImportedContact,
	LocalContact,
	LocalContactUpdate,
} from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Collection, Db, DeleteResult, Filter, FindCursor, FindOptions, IndexDescription, UpdateFilter, UpdateResult } from 'mongodb';
import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const OUTLOOK: IContact['source'] = 'outlook';
const LOCAL: IContact['source'] = 'local';

export class ContactsRaw extends BaseRaw<IContact> implements IContactsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IContact>>) {
		super(db, 'contacts', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			// The ingestion identity. Partial, because a manually created contact has no external id and
			// several of those would otherwise collide on a missing one.
			{
				key: { uid: 1, source: 1, folderId: 1, externalId: 1 },
				unique: true,
				partialFilterExpression: { externalId: { $exists: true } },
			},
			{
				key: { 'uid': 1, 'phones.e164': 1 },
				partialFilterExpression: { 'phones.e164': { $exists: true } },
			},
			{
				key: { uid: 1, displayName: 1 },
			},
		];
	}

	public findPaginatedByUserId(
		uid: IUser['_id'],
		text: string | undefined,
		options: FindOptions<IContact>,
	): FindPaginated<FindCursor<IContact>> {
		const query: Filter<IContact> = { uid };

		if (text) {
			const pattern = { $regex: escapeRegExp(text), $options: 'i' };

			query.$or = [{ displayName: pattern }, { companyName: pattern }, { 'emails.address': pattern }, { 'phones.raw': pattern }];
		}

		return this.findPaginated(query, options);
	}

	public findByUserIdAndPhone(uid: IUser['_id'], e164: string): FindCursor<IContact> {
		return this.find({ uid, 'phones.e164': e164 }, { sort: { displayName: 1 } });
	}

	public async createLocal(contact: LocalContact): Promise<IContact['_id']> {
		const { insertedId } = await this.insertOne({ ...contact, source: LOCAL });

		return insertedId;
	}

	public async updateLocal(uid: IUser['_id'], contactId: IContact['_id'], contact: LocalContactUpdate): Promise<UpdateResult> {
		const { surname, companyName, ...fields } = contact;

		const update: UpdateFilter<IContact> = {
			$set: { ...fields, ...(surname && { surname }), ...(companyName && { companyName }) },
		};

		if (!surname || !companyName) {
			update.$unset = { ...(surname ? {} : { surname: 1 }), ...(companyName ? {} : { companyName: 1 }) };
		}

		return this.updateOne({ _id: contactId, uid, source: LOCAL }, update);
	}

	public deleteLocal(uid: IUser['_id'], contactId: IContact['_id']): Promise<DeleteResult> {
		return this.deleteOne({ _id: contactId, uid, source: LOCAL });
	}

	public async bulkUpsertImported(contacts: ImportedContact[], lastSyncAt: Date): Promise<ContactBulkUpsertResult> {
		if (!contacts.length) {
			return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
		}

		const now = new Date();

		const result = await this.col.bulkWrite(
			contacts.map(({ uid, externalId, folderId, ...fields }) => ({
				updateOne: {
					filter: { uid, source: OUTLOOK, folderId, externalId },
					update: {
						$set: { ...fields, lastSyncAt, _updatedAt: now },
						$setOnInsert: { _id: new ObjectId().toHexString(), uid, source: OUTLOOK, folderId, externalId },
					},
					upsert: true,
				},
			})),
			{ ordered: false },
		);

		return {
			matchedCount: result.matchedCount,
			modifiedCount: result.modifiedCount,
			upsertedCount: result.upsertedCount,
		};
	}

	public deleteImportedByExternalIds(uid: IUser['_id'], folderId: string, externalIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId, externalId: { $in: externalIds } });
	}

	public deleteImportedOutsideSet(uid: IUser['_id'], folderId: string, keepExternalIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId, externalId: { $type: 'string', $nin: keepExternalIds } });
	}

	public deleteImportedByFolder(uid: IUser['_id'], folderId: string): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId });
	}
}

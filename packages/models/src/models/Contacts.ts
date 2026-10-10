import type { IContact, IContactPublic, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	ContactBulkUpsertResult,
	DocumentWithProjection,
	FindOptionsWithProjection,
	FindPaginated,
	IContactsModel,
	ImportedContact,
	LocalContact,
	LocalContactUpdate,
} from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Collection, Db, DeleteResult, Document, Filter, FindCursor, IndexDescription, UpdateFilter, UpdateResult } from 'mongodb';
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

	public findPaginatedByUserId<P extends Document = IContact, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		uid: IUser['_id'],
		text: string | undefined,
		options: O,
		source?: IContact['source'],
	): FindPaginated<FindCursor<DocumentWithProjection<P, O>>> {
		const query: Filter<IContact> = { uid, ...(source && { source }) };

		if (text) {
			const pattern = { $regex: escapeRegExp(text), $options: 'i' };

			query.$or = [{ displayName: pattern }, { companyName: pattern }, { 'emails.address': pattern }, { 'phones.raw': pattern }];
		}

		return this.findPaginated<P, O>(query, options);
	}

	/** Sorted so a number saved on more than one contact always answers with the same name. */
	public findOneByUserIdAndPhone(
		uid: IUser['_id'],
		e164: string,
		source?: IContact['source'],
	): Promise<Pick<IContact, '_id' | 'displayName'> | null> {
		return this.findOne(
			{ uid, 'phones.e164': e164, ...(source && { source }) },
			{ sort: { displayName: 1 }, projection: { _id: 1, displayName: 1 } },
		);
	}

	public countImportedByUserId(uid: IUser['_id']): Promise<number> {
		return this.countDocuments({ uid, source: OUTLOOK, externalId: { $exists: true } });
	}

	public async createLocal(contact: LocalContact): Promise<IContactPublic | null> {
		const { insertedId } = await this.insertOne({ ...contact, source: LOCAL });

		return this.findOneById(insertedId, { projection: { uid: 0, externalId: 0, folderId: 0, lastSyncAt: 0 } });
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
			contacts.map(({ uid, externalId, folderId, ...fields }) => {
				const set: Record<string, unknown> = { lastSyncAt, _updatedAt: now };
				const unset: Record<string, 1> = {};

				for (const [key, value] of Object.entries(fields)) {
					if (value === undefined) {
						unset[key] = 1;
					} else {
						set[key] = value;
					}
				}

				return {
					updateOne: {
						filter: { uid, source: OUTLOOK, folderId, externalId },
						update: {
							$set: set,
							...(Object.keys(unset).length > 0 && { $unset: unset }),
							$setOnInsert: { _id: new ObjectId().toHexString(), uid, source: OUTLOOK, folderId, externalId },
						},
						upsert: true,
					},
				};
			}),
			{ ordered: false },
		);

		return {
			matchedCount: result.matchedCount,
			modifiedCount: result.modifiedCount,
			upsertedCount: result.upsertedCount,
		};
	}

	public findImportedByFolder<P extends Document = IContact, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		uid: IUser['_id'],
		folderId: string,
		externalIds?: { in: string[] } | { notIn: string[] },
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		const query: Filter<IContact> = { uid, source: OUTLOOK, folderId };

		if (externalIds && 'in' in externalIds) {
			query.externalId = { $in: externalIds.in };
		}

		if (externalIds && 'notIn' in externalIds) {
			query.externalId = { $type: 'string', $nin: externalIds.notIn };
		}

		return this.find<P, O>(query, options);
	}

	public deleteImportedByExternalIds(uid: IUser['_id'], folderId: string, externalIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId, externalId: { $in: externalIds } });
	}

	public deleteImportedOutsideSet(uid: IUser['_id'], folderId: string, keepExternalIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId, externalId: { $exists: true, $nin: keepExternalIds } });
	}

	public deleteImportedByFolder(uid: IUser['_id'], folderId: string): Promise<DeleteResult> {
		return this.deleteMany({ uid, source: OUTLOOK, folderId });
	}
}

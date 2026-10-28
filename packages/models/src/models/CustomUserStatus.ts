import type { ICustomUserStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICustomUserStatusModel, InsertionModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, InsertOneResult, UpdateResult, WithId, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CustomUserStatusRaw extends BaseRaw<ICustomUserStatus> implements ICustomUserStatusModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICustomUserStatus>>) {
		super(db, 'custom_user_status', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }];
	}

	async findOneByName<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return options ? this.findOne<T, O>({ name }, options) : this.findOne<T, O>({ name });
	}

	findOneByNameExceptId<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		except: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.findOne<T, O>(query, options);
	}

	// find
	findByName<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			name,
		};

		return this.find<T, O>(query, options);
	}

	findByNameExceptId<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		except: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find<T, O>(query, options);
	}

	// update
	setName(_id: string, name: string): Promise<UpdateResult> {
		const update = {
			$set: {
				name,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setStatusType(_id: string, statusType: string): Promise<UpdateResult> {
		const update = {
			$set: {
				statusType,
			},
		};

		return this.updateOne({ _id }, update);
	}

	// INSERT
	create(data: InsertionModel<ICustomUserStatus>): Promise<InsertOneResult<WithId<ICustomUserStatus>>> {
		return this.insertOne(data);
	}
}

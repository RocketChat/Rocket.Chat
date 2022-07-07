import type { ICustomUserStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICustomUserStatusModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, FindOptions, IndexDescription, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CustomUserStatusRaw extends BaseRaw<ICustomUserStatus> implements ICustomUserStatusModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICustomUserStatus>>) {
		super(db, 'custom_user_status', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }];
	}

	// find one by name

	async findOneByName(name: string, options?: undefined): Promise<ICustomUserStatus | null>;

	async findOneByName(name: string, options?: FindOptions<ICustomUserStatus>): Promise<ICustomUserStatus | null> {
		return options ? this.findOne({ name }, options) : this.findOne({ name });
	}

	// find
	findByName(name: string, options: FindOptions<ICustomUserStatus>): FindCursor<ICustomUserStatus> {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name: string, except: string, options: FindOptions<ICustomUserStatus>): FindCursor<ICustomUserStatus> {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
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
	create(data: ICustomUserStatus): Promise<InsertOneResult<WithId<ICustomUserStatus>>> {
		return this.insertOne(data);
	}
}

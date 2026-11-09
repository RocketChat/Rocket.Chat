import type { IScheduledConference } from '@rocket.chat/core-typings';
import type { InsertionModel, IScheduledConferencesModel } from '@rocket.chat/model-typings';
import type { Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ScheduledConferencesRaw extends BaseRaw<IScheduledConference> implements IScheduledConferencesModel {
	constructor(db: Db) {
		super(db, 'scheduled_conference');
	}

	protected override modelIndexes(): IndexDescription[] {
		// Unlike a conference's, a booking's alias is never released, so it is unique across the whole collection.
		return [{ key: { sipAlias: 1 }, unique: true, partialFilterExpression: { sipAlias: { $exists: true } } }];
	}

	public async create({
		sipAlias,
		...data
	}: Omit<InsertionModel<IScheduledConference>, 'createdAt'>): Promise<IScheduledConference['_id']> {
		const result = await this.insertOne({
			...data,
			// Spread rather than assigned: an explicit `undefined` is written as `null`, which the alias index's
			// `$exists` filter counts — so every booking without an alias would collide with the last.
			...(sipAlias ? { sipAlias } : {}),
			createdAt: new Date(),
		});

		return result.insertedId;
	}

	public async findOneBySipAlias<T extends IScheduledConference>(sipAlias: string, options?: FindOptions<T>): Promise<T | null> {
		return this.findOne<T>({ sipAlias }, options || {});
	}
}

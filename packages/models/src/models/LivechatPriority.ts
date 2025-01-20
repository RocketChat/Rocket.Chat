import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Db, UpdateFilter, WithId, IndexDescription, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

// TODO need to define type for LivechatPriority object
export class LivechatPriorityRaw extends BaseRaw<ILivechatPriority> implements ILivechatPriorityModel {
	constructor(db: Db) {
		super(db, 'livechat_priority');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					name: 1,
				},
				unique: true,
				partialFilterExpression: {
					$and: [{ name: { $exists: true } }, { name: { $gt: '' } }],
				},
			},
		];
	}

	findOneByIdOrName(_idOrName: string, options = {}): Promise<ILivechatPriority | null> {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneNameUsingRegex(_idOrName: string, options = {}): Promise<ILivechatPriority | null> {
		const query = {
			name: new RegExp(`^${escapeRegExp(_idOrName.trim())}$`, 'i'),
		};

		return this.findOne(query, options);
	}

	findByDirty(): FindCursor<Pick<ILivechatPriority, '_id'>> {
		return this.find({ dirty: true }, { projection: { _id: 1 } });
	}

	async canResetPriorities(): Promise<boolean> {
		return Boolean(await this.findOne({ dirty: true }, { projection: { _id: 1 } }));
	}

	async resetPriorities(ids: ILivechatPriority['_id'][]): Promise<void> {
		await this.updateMany({ _id: { $in: ids } }, [{ $set: { dirty: false } }, { $unset: 'name' }]);
	}

	async updatePriority(_id: string, reset: boolean, name?: string): Promise<null | WithId<ILivechatPriority>> {
		const query = {
			_id,
		};

		const update: Pick<UpdateFilter<ILivechatPriority>, '$set' | '$unset'> = {
			...((reset && {
				$set: { dirty: false },
				$unset: { name: 1 },
			}) || {
				// Trim value before inserting
				$set: { name: name?.trim(), dirty: true },
			}),
		};

		return this.findOneAndUpdate(query, update, {
			returnDocument: 'after',
		});
	}
}

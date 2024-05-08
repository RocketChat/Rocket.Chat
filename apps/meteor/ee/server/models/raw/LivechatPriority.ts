import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { UpdateFilter, ModifyResult, IndexDescription } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

// TODO need to define type for LivechatPriority object
export class LivechatPriorityRaw extends BaseRaw<ILivechatPriority> implements ILivechatPriorityModel {
	constructor() {
		super('livechat_priority');
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

	async canResetPriorities(): Promise<boolean> {
		return Boolean(await this.findOne({ dirty: true }, { projection: { _id: 1 } }));
	}

	async resetPriorities(): Promise<void> {
		await this.updateMany({ dirty: true }, [{ $set: { dirty: false } }, { $unset: 'name' }]);
	}

	async updatePriority(_id: string, reset: boolean, name?: string): Promise<ModifyResult<ILivechatPriority>> {
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

import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import type { IOmnichannelServiceLevelAgreementsModel } from '@rocket.chat/model-typings/src';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

export class ServiceLevelAgreements extends BaseRaw<IOmnichannelServiceLevelAgreements> implements IOmnichannelServiceLevelAgreementsModel {
	constructor(db: Db) {
		super(db, 'omnichannel_service_level_agreements');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { name: 1 }, unique: true },
			{ key: { dueTimeInMinutes: 1 }, unique: true },
		];
	}

	findDuplicate(
		_id: string | null,
		name: string,
		dueTimeInMinutes: number,
	): Promise<Pick<IOmnichannelServiceLevelAgreements, '_id'> | null> {
		return this.findOne({ ...(_id && { _id: { $ne: _id } }), $or: [{ name }, { dueTimeInMinutes }] }, { projection: { _id: 1 } });
	}

	findOneByIdOrName(_idOrName: string, options = {}): Promise<IOmnichannelServiceLevelAgreements | null> {
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

	async createOrUpdatePriority(
		{ name, description, dueTimeInMinutes }: Pick<IOmnichannelServiceLevelAgreements, 'name' | 'description' | 'dueTimeInMinutes'>,
		_id: string | null,
	): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updatedAt'>> {
		const record = {
			name,
			description,
			dueTimeInMinutes: parseInt(`${dueTimeInMinutes}`),
		};

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		return Object.assign(record, { _id });
	}
}

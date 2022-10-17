import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import type { IOmnichannelServiceLevelAgreementsModel } from '@rocket.chat/model-typings/src';
import type { Db } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class ServiceLevelAgreements extends BaseRaw<IOmnichannelServiceLevelAgreements> implements IOmnichannelServiceLevelAgreementsModel {
	constructor(db: Db) {
		super(db, 'omnichannel_service_level_agreements');
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
		_id?: string,
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

import type { IMedsensePharmacy } from '@rocket.chat/core-typings';
import type { IMedsensePharmaciesModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsensePharmaciesRaw extends BaseRaw<IMedsensePharmacy> implements IMedsensePharmaciesModel {
	constructor(db: Db) {
		super(db, 'medsense_pharmacies');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					slug: 1,
				},
				unique: true,
			},
			{
				key: {
					name: 1,
				},
			},
		];
	}

	findOneBySlug(slug: string, options = {}) {
		return this.findOne({ slug }, options);
	}

	create(data: Omit<IMedsensePharmacy, '_id' | 'createdAt' | 'updatedAt'>) {
		return this.insertOne({
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}
}

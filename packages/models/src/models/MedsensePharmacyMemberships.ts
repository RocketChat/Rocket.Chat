import type { IMedsensePharmacyMembership } from '@rocket.chat/core-typings';
import type { IMedsensePharmacyMembershipsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsensePharmacyMembershipsRaw extends BaseRaw<IMedsensePharmacyMembership> implements IMedsensePharmacyMembershipsModel {
	constructor(db: Db) {
		super(db, 'medsense_pharmacy_memberships');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					pharmacyId: 1,
					userId: 1,
				},
				unique: true,
			},
			{
				key: {
					userId: 1,
				},
			},
		];
	}

	findByUserId(userId: string, options = {}) {
		return this.find({ userId }, options);
	}

	findByPharmacyId(pharmacyId: string, options = {}) {
		return this.find({ pharmacyId }, options);
	}
}

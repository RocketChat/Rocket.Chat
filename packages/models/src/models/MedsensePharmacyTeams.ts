import type { IMedsensePharmacyTeam } from '@rocket.chat/core-typings';
import type { IMedsensePharmacyTeamsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsensePharmacyTeamsRaw extends BaseRaw<IMedsensePharmacyTeam> implements IMedsensePharmacyTeamsModel {
	constructor(db: Db) {
		super(db, 'medsense_pharmacy_teams');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					pharmacyId: 1,
					teamId: 1,
				},
				unique: true,
			},
			{
				key: {
					pharmacyId: 1,
				},
			},
		];
	}

	findByPharmacyId(pharmacyId: string, options = {}) {
		return this.find({ pharmacyId }, options);
	}
}

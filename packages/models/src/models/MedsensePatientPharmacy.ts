import type { IMedsensePatientPharmacy } from '@rocket.chat/core-typings';
import type { IMedsensePatientPharmacyModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsensePatientPharmacyRaw extends BaseRaw<IMedsensePatientPharmacy> implements IMedsensePatientPharmacyModel {
	constructor(db: Db) {
		super(db, 'medsense_patient_pharmacy');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					patientUserId: 1,
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

	findByPatientUserId(patientUserId: string, options = {}) {
		return this.findOne({ patientUserId }, options);
	}

	setStartPharmacy(patientUserId: string, pharmacyId: string, setBy: string) {
		return this.updateOne(
			{ patientUserId },
			{
				$set: {
					pharmacyId,
					setBy,
					setAt: new Date(),
					updatedAt: new Date(),
				},
				$setOnInsert: {
					createdAt: new Date(),
				},
			},
			{ upsert: true },
		);
	}
}

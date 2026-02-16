
import type { IMedsenseIntervention } from '@rocket.chat/core-typings';
import type { IMedsenseInterventionsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsenseInterventionsRaw extends BaseRaw<IMedsenseIntervention> implements IMedsenseInterventionsModel {
    constructor(db: Db) {
        super(db, 'medsense_interventions');
    }

    protected override modelIndexes(): IndexDescription[] {
        return [
            { key: { pharmacyId: 1, createdAt: -1 } },
            { key: { patientUserId: 1 } },
        ];
    }

    findByPharmacyId(pharmacyId: string): FindCursor<IMedsenseIntervention> {
        return this.find({ pharmacyId }, { sort: { createdAt: -1 } });
    }

    findByPatientUserId(patientUserId: string, pharmacyId?: string): FindCursor<IMedsenseIntervention> {
        const query: any = { patientUserId };
        if (pharmacyId) {
            query.pharmacyId = pharmacyId;
        }
        return this.find(query, { sort: { createdAt: -1 } });
    }

    async createIntervention(data: Omit<IMedsenseIntervention, '_id' | '_updatedAt'>): Promise<string> {
        const result = await this.insertOne({
            ...data,
            _updatedAt: new Date(),
        });
        return result.insertedId;
    }




}

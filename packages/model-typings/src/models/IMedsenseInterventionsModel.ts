import type { FindCursor } from 'mongodb';
import type { IMedsenseIntervention } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsenseInterventionsModel extends IBaseModel<IMedsenseIntervention> {
    findByPharmacyId(pharmacyId: string): FindCursor<IMedsenseIntervention>;
    findByPatientUserId(patientUserId: string, pharmacyId?: string): FindCursor<IMedsenseIntervention>;
    createIntervention(data: Omit<IMedsenseIntervention, '_id' | '_updatedAt'>): Promise<string>;
}

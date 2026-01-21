import type { IMedsensePatientPharmacy } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMedsensePatientPharmacyModel extends IBaseModel<IMedsensePatientPharmacy> {
	findByPatientUserId(patientUserId: string, options?: any): Promise<IMedsensePatientPharmacy | null>;
	setStartPharmacy(patientUserId: string, pharmacyId: string, setBy: string): Promise<any>;
}

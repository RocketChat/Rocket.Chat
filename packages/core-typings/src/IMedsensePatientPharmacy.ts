import type { IBaseData } from './IBaseData';

export interface IMedsensePatientPharmacy extends IBaseData {
	patientUserId: string;
	pharmacyId: string;
	setBy: string;
	setAt: Date;
}

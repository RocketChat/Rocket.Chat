import type { IBaseData } from './IBaseData';

export interface IMedsensePharmacyMembership extends IBaseData {
	pharmacyId: string;
	userId: string;
	roles: ('manager' | 'staff')[];
	active: boolean;
	createdBy: string;
}

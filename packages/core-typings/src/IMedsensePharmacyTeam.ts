import type { IBaseData } from './IBaseData';

export interface IMedsensePharmacyTeam extends IBaseData {
	pharmacyId: string;
	teamId: string;
	purpose: 'pharmacist' | 'technician' | 'assistant' | 'general';
	intakeRoomId?: string;
	handoverRoomId?: string;
}

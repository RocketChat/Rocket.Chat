import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseIntervention extends IRocketChatRecord {
	_id: string;
	pharmacyId: string;
	patientUserId: string;
	type: string;
	notes?: string;
	createdBy: {
		_id: string;
		username: string;
	};
	createdAt: Date;
	_updatedAt: Date;
}

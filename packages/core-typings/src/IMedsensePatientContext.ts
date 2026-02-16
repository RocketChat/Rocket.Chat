import type { IRocketChatRecord } from './IRocketChatRecord';

export type MedsensePatientContextType = 'allergy' | 'medication' | 'medical_history';

export type MedsensePatientContextSource = 'session_rollup' | 'staff';

export type MedsensePatientContextVocab = 'RXNORM' | 'SNOMEDCT_US';

export type MedsensePatientContextStatus = 'active' | 'historical';

export interface IMedsensePatientContextNote {
	text: string;
	addedAt: Date;
	roomId: string;
	source: MedsensePatientContextSource;
}

export interface IMedsensePatientContext extends IRocketChatRecord {
	_id: string;
	patientUserId: string;
	type: MedsensePatientContextType;
	entityName: string;
	cui: string;
	vocab: MedsensePatientContextVocab;
	code?: string;
	status: MedsensePatientContextStatus;
	notes: IMedsensePatientContextNote[];
	addedAt: Date;
	_updatedAt: Date;

	// Legacy compatibility fields
	summary?: string;
	tags?: string[];
	roomId?: string;
	source?: MedsensePatientContextSource;
}

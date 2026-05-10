import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseAudit extends IRocketChatRecord {
	roomId: string;
	teamId?: string;
	pharmacyId?: string;
	action: 'pending' | 'taken' | 'closed' | 'voice_identity_confirmed';
	userId: string; // The user performing the action (or system/orchestrator)
	patientUserId?: string; // The patient being discussed
	takenBy?: string; // userId of who took the chat (for 'taken' action)
	takenAt?: Date; // Timestamp when taken (for 'taken' action)
	pendingSetAt?: Date; // Timestamp when added to queue (for context)
	at: Date;
	issueTitle?: string;
	reason?: string;
	meta?: Record<string, any>; // Optional metadata
}

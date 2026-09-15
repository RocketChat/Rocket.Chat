import type { IRocketChatRecord } from '../../IRocketChatRecord';

export interface FederationMatrixTransaction extends IRocketChatRecord {
	appServiceId: string;
	senderId: string;
	roomId: string;
	eventType: string;
	txnId: string;
	eventId: string;
	createdAt: Date;
}
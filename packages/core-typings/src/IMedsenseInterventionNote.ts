import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseInterventionNote extends IRocketChatRecord {
	_id: string;
	interventionId: string;
	text: string;
	authorId: string;
	authorUsername: string;
	createdAt: Date;
	_updatedAt: Date;
}

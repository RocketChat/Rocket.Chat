// packages/core-typings/src/IModerationAuditLog.ts
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IModerationAuditLog extends IRocketChatRecord {
	ts: Date;
	moderator: {
		_id: IUser['_id'];
		username: string;
		name: string;
	};
	action: 'mute' | 'deactivate' | 'flag' | 'dismiss';
	targetUser: {
		_id: IUser['_id'];
		username: string;
		name: string;
		createdAt: Date;
	};
	targetAccountAge: number; // in seconds
	reason?: string;
}

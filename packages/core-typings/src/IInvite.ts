import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInvite extends IRocketChatRecord {
	days: number;
	maxUses: number;
	rid: string;
	userId: string;
	createdAt: Date;
	expires: Date | null;
	uses: number;
	url: string;
}

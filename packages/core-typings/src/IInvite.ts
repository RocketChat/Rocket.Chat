import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInvite extends IRocketChatRecord {
	days: number;
	inviteToken: string;
	legacy?: boolean;
	maxUses: number;
	rid: string;
	userId: string;
	createdAt: Date;
	expires: Date | null;
	uses: number;
	url: string;
}

export type IInviteSummary = Pick<
	IInvite,
	'_id' | '_updatedAt' | 'rid' | 'userId' | 'createdAt' | 'expires' | 'days' | 'maxUses' | 'uses' | 'legacy'
> & { roomName?: string };

import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IAvatar extends IRocketChatRecord {
	name: string;
	rid: string;
	userId: string;
	store: string;
	complete: boolean;
	uploading: boolean;
	progress: number;
	extension: string;
	uploadedAt: Date;
}

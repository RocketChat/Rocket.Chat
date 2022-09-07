import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IMatrixBridgedRoom extends IRocketChatRecord {
	rid: string;
	mri: string;
}

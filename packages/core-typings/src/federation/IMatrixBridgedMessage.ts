import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IMatrixBridgedMessage extends IRocketChatRecord {
	mid: string;
	meid: string;
}

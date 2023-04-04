import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IMatrixBridgedUser extends IRocketChatRecord {
	uid: string;
	mui: string;
	remote: boolean;
}

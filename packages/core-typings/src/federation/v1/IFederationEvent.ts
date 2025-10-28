import type { IRocketChatRecord } from '../../IRocketChatRecord';

export interface IFederationEvent extends IRocketChatRecord {
	origin: string;
	context: { roomId: string };
	parentIds: string[];
	type: string;
	timestamp: Date;
	data: any;
	hasChildren: boolean;
}

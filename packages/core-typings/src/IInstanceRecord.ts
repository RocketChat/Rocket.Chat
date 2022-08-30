import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInstanceRecord extends IRocketChatRecord {
	name: string;
	pid: number;
	_updatedAt: Date;
	extraInformation: {
		host: string;
		nodeVersion: string;
		port: string;
	};
}

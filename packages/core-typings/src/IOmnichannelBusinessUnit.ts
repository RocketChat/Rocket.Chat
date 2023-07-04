import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOmnichannelBusinessUnit extends IRocketChatRecord {
	_id: string;
	name: string;
	visibility: 'public' | 'private';
	type: string;
	numMonitors: number;
	numDepartments: number;
	// Units don't have ancestors per se, but we need TS to know it can access the property from the collection
	ancestors?: string[];
}

import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatCustomField extends IRocketChatRecord {
	label: string;
	scope: 'visitor' | 'room';
	visibility: string;
	type?: string;
	regexp?: string;
	required?: boolean;
	defaultValue?: string;
	options?: string;
	public?: boolean;
}

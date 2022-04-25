import { IRocketChatRecord } from './IRocketChatRecord';

export interface ICustomField extends IRocketChatRecord {
	_id: string;
	type: 'text' | 'select';
	regexp?: string;
	required?: boolean;
	defaultValue?: string;
	options?: string;
	public?: boolean;
	minLength?: number;
	maxLength?: number;
	modifyRecordField?: { array: boolean; field: string };
	sendToIntegrations?: boolean;
}

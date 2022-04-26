import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatDepartmentRecord extends IRocketChatRecord {
	_id: string;
	name: string;
	enabled: boolean;
	description?: string;
	showOnRegistration: boolean;
	showOnOfflineForm: boolean;
	requestTagBeforeClosingChat?: boolean;
	email: string;
	chatClosingTags?: string[];
	offlineMessageChannelName: string;
	numAgents: number;
	businessHourId?: string;
	fallbackForwardDepartment?: string;
	// extra optional fields
	[k: string]: any;
}

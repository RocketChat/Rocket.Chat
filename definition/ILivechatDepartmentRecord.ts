import { IRocketChatRecord } from './IRocketChatRecord';


export interface ILivechatDepartmentRecord extends IRocketChatRecord {
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
	// optional fields
	[k: string]: any;
}

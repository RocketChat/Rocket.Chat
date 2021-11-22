import { IRocketChatRecord } from './IRocketChatRecord';


export interface ILivechatAgentRecord extends IRocketChatRecord {
	_id: string;
	emails: {
		address: string;
		verified: boolean;
	}[];
	status: string;
	name: string;
	username: string;
	statusLivechat: string;
	livechat: {
		maxNumberSimultaneousChat: number;
	};
}

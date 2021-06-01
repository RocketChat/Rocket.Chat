import { IRocketChatRecord } from './IRocketChatRecord';


export interface ILivechatAgentRecord extends IRocketChatRecord {
	_id: string;
	emails: { adress: string; verified: boolean };
	status: string;
	name: string;
	username: string;
	statusLivechat: string;
}

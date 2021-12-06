import { IRocketChatRecord } from './IRocketChatRecord';

export interface IVisitorPhone {
	phoneNumber: string;
}

export interface IVisitorLastChat {
	_id: string;
	ts: string;
}

export interface ILivechatVisitorConnectionData {
	httpHeaders: {
		[k: string]: string;
	};
	clientAddress: string;
}

export interface IVisitorEmail {
	address: string;
}

export interface ILivechatVisitor extends IRocketChatRecord {
	username: string;
	ts: Date;
	token: string;
	department?: string;
	name?: string;
	phone?: (IVisitorPhone)[] | null;
	lastChat?: IVisitorLastChat;
	userAgent?: string;
	ip?: string;
	host?: string;
	visitorEmails?: IVisitorEmail[];
}

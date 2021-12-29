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
	phone?: IVisitorPhone[] | null;
	lastChat?: IVisitorLastChat;
	userAgent?: string;
	ip?: string;
	host?: string;
	visitorEmails?: IVisitorEmail[];
}

export interface ILivechatVisitorDTO {
	id: string;
	token: string;
	name: string;
	email: string;
	department: string;
	phone: string | { number: string };
	username: string;
	customFields: {
		key: string;
		value: string;
		overwrite: boolean;
	}[];
	connectionData: {
		httpHeaders: Record<string, string>;
	};
}

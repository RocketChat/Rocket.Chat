export type IAlertId = 'UNREAD_MESSAGES' | 'CONNECTING_AGENT' | 'LIVECHAT_CONNECTED' | 'LIVECHAT_DISCONNECTED';

export type IAlert = {
	_id: IAlertId;
	children?: string;
	success?: boolean;
	type?: string;
	error?: boolean;
};

export type ILivechatAgent = {
	_id: string;
	username: string;
	name?: string;
	status?: string;
	email: string;
	phone?: string;
	avatar?: { description: string; src: string };
};

export type ILivechatVisitorInfo = {
	lastChat: {_id: string; ts: string};
	name: string;
	token: string;
	ts: string;
	username: string;
	visitorEmails: Array<{
		address: string;
	}>;
	_id: string;
	_updatedAt: string;
} | {};

export interface ILivechatAgent {
	_id: string;
	emails: { adress: string; verified: boolean };
	status: string;
	name: string;
	username: string;
	statusLivechat: string;
}

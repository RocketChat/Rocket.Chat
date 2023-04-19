export type IAlert = {
	_id: string;
	rid: string;
	ts: Date;
	type: string;
	title: string;
	message: string;
	params: string;
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

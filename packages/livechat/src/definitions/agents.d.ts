// TODO: Fully type agents in livechat

// Part of the public setAgent() embedding API (see lib/hooks.ts) — this payload
// type is also provided by third-party integrations on the host page, so it does
// not mirror ILivechatAgent 1:1, nor is it a mistake that it doesn't.
// Changing it may introduce breaking changes.
export type Agent = {
	_id: string;
	username: string;
	name?: string;
	status?: string;
	email?: string;
	phone?: string;
	username: string;
	avatar?: {
		description: string;
		src: string;
	};
	ts: number;
	[key: string]: unknown;
};

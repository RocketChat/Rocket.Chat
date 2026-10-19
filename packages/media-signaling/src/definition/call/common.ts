export type CallActorType = 'user' | 'sip';

export type CallContact = {
	type?: CallActorType;
	id?: string;
	contractId?: string;

	uid?: string;
	displayName?: string;
	username?: string;
	sipExtension?: string;
};

export type CallRole = 'caller' | 'callee';

import type { IUser, IInvite } from '@rocket.chat/core-typings';

export type InvitesEndpoints = {
	'listInvites': {
		GET: (params: { userId: IUser['_id']; rid: string }) => {
			invites: IInvite[];
		};
	};

	'findOrCreateInvite': {
		POST: (params: { userId: IUser['_id']; rid: IInvite['rid']; days: IInvite['days']; maxUses: IInvite['maxUses'] }) => {
			invite: IInvite;
		};
	};

	'removeInvite/:_id': {
		DELETE: () => void;
	};

	'useInviteToken': {
		POST: (params: { userId: IUser['_id']; token: string }) => {
			invite: IInvite;
		};
	};

	'validateInviteToken': {
		POST: (params: { userId: IUser['_id']; token: string }) => {
			invite: IInvite;
		};
	};
};

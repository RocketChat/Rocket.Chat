import type { IUser, IInvite, IRoom } from '@rocket.chat/core-typings';

export type InvitesEndpoints = {
	'listInvites': {
		GET: (params: { userId: IUser['_id']; rid: string }) => IInvite[];
	};

	'findOrCreateInvite': {
		POST: (params: { userId: IUser['_id']; rid: IInvite['rid']; days: IInvite['days']; maxUses: IInvite['maxUses'] }) => IInvite | false;
	};

	'removeInvite/:_id': {
		DELETE: () => boolean;
	};

	'useInviteToken': {
		POST: (params: { userId: IUser['_id']; token: string }) => {
			room: {
				rid: IRoom['_id'];
				prid: IRoom['prid'];
				fname: IRoom['fname'];
				name: IRoom['name'];
				t: IRoom['t'];
			};
		};
	};

	'validateInviteToken': {
		POST: (params: { userId: IUser['_id']; token: string }) => {
			valid: boolean;
		};
	};
};

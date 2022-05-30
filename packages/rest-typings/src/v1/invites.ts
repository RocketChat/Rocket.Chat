import type { IInvite, IRoom } from '@rocket.chat/core-typings';

export type InvitesEndpoints = {
	'listInvites': {
		GET: (params: { rid: string }) => IInvite[];
	};

	'findOrCreateInvite': {
		POST: (params: { rid: IInvite['rid']; days: IInvite['days']; maxUses: IInvite['maxUses'] }) => IInvite | false;
	};

	'removeInvite/:_id': {
		DELETE: () => boolean;
	};

	'useInviteToken': {
		POST: (params: { token: string }) => {
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
		POST: (params: { token: string }) => {
			valid: boolean;
		};
	};
};

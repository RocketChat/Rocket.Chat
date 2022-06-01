import type { IInvite, IRoom } from '@rocket.chat/core-typings';

export type ListInvites = { rid: string };

export type FindOrCreateInvite = { rid: IInvite['rid']; days: IInvite['days']; maxUses: IInvite['maxUses'] };

export type UseInviteToken = { token: string };

export type ValidateInviteToken = { token: string };

export type InvitesEndpoints = {
	'listInvites': {
		GET: (params: ListInvites) => IInvite[];
	};

	'findOrCreateInvite': {
		POST: (params: FindOrCreateInvite) => IInvite | false;
	};

	'removeInvite/:_id': {
		DELETE: () => boolean;
	};

	'useInviteToken': {
		POST: (params: UseInviteToken) => {
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
		POST: (params: ValidateInviteToken) => {
			valid: boolean;
		};
	};
};

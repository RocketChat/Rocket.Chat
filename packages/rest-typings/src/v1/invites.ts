import type { IInvite, IRoom } from '@rocket.chat/core-typings';

export type InvitesEndpoints = {
	'/v1/listInvites': {
		GET: () => Array<IInvite>;
	};
	'/v1/removeInvite/:_id': {
		DELETE: () => void;
	};
	'/v1/useInviteToken': {
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
	'/v1/validateInviteToken': {
		POST: (params: { token: string }) => { valid: boolean };
	};
};

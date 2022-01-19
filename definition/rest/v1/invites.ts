import type { IInvite } from '../../IInvite';
import type { IRoom } from '../../IRoom';

export type InvitesEndpoints = {
	'listInvites': {
		GET: () => Array<IInvite>;
	};
	'removeInvite/:_id': {
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

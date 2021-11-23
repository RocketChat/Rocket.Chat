export type InvitesEndpoints = {
	'listInvites': {
		GET: () => void;
	};
	'removeInvite/:_id': {
		DELETE: () => void;
	};
};

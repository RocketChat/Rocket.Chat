import { IMDMSession, IMDMSessionParams } from '../../../definition/ISession';

export type SessionsEndpoints = {
	'sessions.list': {
		GET: (params: IMDMSessionParams) => IMDMSession;
	};

	'sessions.list.all': {
		GET: (params: IMDMSessionParams) => IMDMSession;
	};
};

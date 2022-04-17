import { IMDMSession, IMDMSessionParams, ISession } from '../../../definition/ISession';

export type SessionsEndpoints = {
	'sessions.list': {
		GET: (params: IMDMSessionParams) => IMDMSession;
	};

};

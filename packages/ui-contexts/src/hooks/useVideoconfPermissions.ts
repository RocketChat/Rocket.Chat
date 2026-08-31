import type { ObjectId } from 'mongodb';

import { usePermission } from './usePermission';
import { useSetting } from './useSetting';

export const useVideoconfPermissions = (scope?: string | ObjectId) => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);
	const canJoin = usePermission('videoconf-join-call', scope);
	const canManageConference = usePermission('call-management', scope);

	return {
		canJoinConference: allowAnonymousRead || canJoin || canManageConference,
		canManageConference,
	};
};

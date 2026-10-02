import { usePermission } from './usePermission';
import { useSetting } from './useSetting';

export const useVideoconfPermissions = (scope?: string) => {
	// TODO: Figure out if anonymous access will also be supported in the official client
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);
	const canJoin = usePermission('videoconf-access'); // videoconf-access should not be used with a scope
	const canManageConference = usePermission('call-management', scope);

	return {
		canJoinConference: allowAnonymousRead || canJoin,
		canManageConference: canJoin && canManageConference,
	};
};

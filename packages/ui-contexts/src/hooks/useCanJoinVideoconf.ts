import type { ObjectId } from 'mongodb';

import { useAtLeastOnePermission } from './useAtLeastOnePermission';
import { useSetting } from './useSetting';

const JOIN_PERMISSIONS = ['call-management', 'videoconf-join-call'];

export const useCanJoinVideoconf = (scope?: string | ObjectId): boolean => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);
	const hasJoinPermission = useAtLeastOnePermission(JOIN_PERMISSIONS, scope);

	return allowAnonymousRead || hasJoinPermission;
};

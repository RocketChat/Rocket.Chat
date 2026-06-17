import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import HomeSkeleton from '../../home/HomeSkeleton';

const UsernameCheck = ({ children }: { children: ReactNode }) => {
	const userId = useUserId();
	const { data: userData, isLoading } = useUserInfoQuery({ userId: userId || '' }, { enabled: !!userId });

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);

	const shouldRegisterUsername = useMemo(() => {
		const hasUserInCollection = !!userData?.user;
		const hasUsername = !!userData?.user?.username;

		if (!userId) {
			return !allowAnonymousRead;
		}

		if (!hasUserInCollection) {
			return true;
		}

		return !hasUsername;
	}, [userData?.user, userId, allowAnonymousRead]);

	if (isLoading) {
		return <HomeSkeleton />;
	}

	if (shouldRegisterUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

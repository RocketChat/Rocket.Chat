import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';

export type UsernameCheckProps = {
	children: ReactNode;
	/**
	 * Shown while the user is being resolved. Required, because the right shape depends on whether the route
	 * renders inside the navigation chrome, and only the caller knows that.
	 */
	loadingElement: ReactNode;
};

const UsernameCheck = ({ children, loadingElement }: UsernameCheckProps) => {
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
		return loadingElement;
	}

	if (shouldRegisterUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

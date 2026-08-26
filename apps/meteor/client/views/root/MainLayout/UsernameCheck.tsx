import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import HomeSkeleton from '../../home/HomeSkeleton';

export type UsernameCheckProps = {
	children: ReactNode;
	/**
	 * Placeholder shown while the user is being resolved. Defaults to the app-shaped skeleton, which only
	 * suits routes that render inside the navigation chrome — standalone routes should pass their own so
	 * they don't flash a sidebar and composer they will never show.
	 */
	loading?: ReactNode;
};

const UsernameCheck = ({ children, loading }: UsernameCheckProps) => {
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
		return loading ?? <HomeSkeleton />;
	}

	if (shouldRegisterUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

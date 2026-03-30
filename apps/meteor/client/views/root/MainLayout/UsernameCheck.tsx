import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';
import PageSkeleton from '../../../components/PageSkeleton';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const userId = useUserId();
	const { data: userData, isLoading } = useUserInfoQuery(
		useMemo(() => ({ userId: userId || '' }), [userId]),
		{ enabled: !!userId },
	);

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

	console.log({ isLoading, shouldRegisterUsername, userId, user: userData?.user });

	if (!isLoading && shouldRegisterUsername) {
		console.log('RegisterUsername');
		return <RegisterUsername />;
	}

	if (isLoading) {
		return <PageSkeleton />;
	}

	console.log('Home');
	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

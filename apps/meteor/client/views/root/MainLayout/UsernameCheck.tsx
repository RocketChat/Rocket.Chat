import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const userId = useUserId();
	const { data: userData, isLoading } = useUserInfoQuery({ userId: userId || '' });

	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead') ?? false;

	const shouldRegisterUsername = useReactiveValue(
		useCallback(() => {
			const hasUserInCollection = !!userData?.user;
			const hasUsername = !!userData?.user?.username;

			if (!userId) {
				return !allowAnonymousRead;
			}

			if (!hasUserInCollection) {
				return true;
			}

			return !hasUsername;
		}, [userData?.user, userId, allowAnonymousRead]),
	);

	if (!isLoading && shouldRegisterUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

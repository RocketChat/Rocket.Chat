import { useUserId, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const user = useUser();
	const hasUserInCollection = !!user;
	const username = user?.username;
	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead') ?? false;

	const shouldRegisterUsername = useReactiveValue(
		useCallback(() => {
			if (!uid) {
				return !allowAnonymousRead;
			}

			if (!hasUserInCollection) {
				return true;
			}

			return !username;
		}, [uid, hasUserInCollection, username, allowAnonymousRead]),
	);

	if (shouldRegisterUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

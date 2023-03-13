import type { IUser } from '@rocket.chat/core-typings';
import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { Users } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import PasswordChangeCheck from './PasswordChangeCheck';
import RegisterUsername from './RegisterUsername';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const hasUsername = useReactiveValue(
		useCallback(() => {
			if (!uid) {
				return allowAnonymousRead;
			}

			const user = uid ? (Users.findOneById(uid, { fields: { username: 1 } }) as IUser | null) : null;
			return user?.username ?? false;
		}, [uid, allowAnonymousRead]),
	);

	if (!hasUsername) {
		return <RegisterUsername />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

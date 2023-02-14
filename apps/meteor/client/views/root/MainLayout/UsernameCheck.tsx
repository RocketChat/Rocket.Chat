import type { IUser } from '@rocket.chat/core-typings';
import { useUserId, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { Users } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';
import PasswordChangeCheck from './PasswordChangeCheck';
import { useViewportScrolling } from './useViewportScrolling';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	useViewportScrolling();

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
		return <BlazeTemplate template='username' />;
	}

	return <PasswordChangeCheck>{children}</PasswordChangeCheck>;
};

export default UsernameCheck;

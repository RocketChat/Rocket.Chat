import React, { ReactElement, ReactNode, useCallback } from 'react';

import { Users } from '../../../../app/models/client';
import { IUser } from '../../../../definition/IUser';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUserId } from '../../../contexts/UserContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';
import PasswordChangeCheck from './PasswordChangeCheck';
import { useCustomScript } from './useCustomScript';
import { useViewportScrolling } from './useViewportScrolling';

const UsernameCheck = ({ children }: { children: ReactNode }): ReactElement => {
	useViewportScrolling();
	useCustomScript();

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

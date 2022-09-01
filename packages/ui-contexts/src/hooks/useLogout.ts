import { useContext } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useRoute } from './useRoute';
import { LoginContext } from '..';

export const useLogout = (): (() => void) => {
	const router = useRoute('home');
	const { logout } = useContext(LoginContext);

	const handleLogout = useMutableCallback(() => {
		logout();
		router.push({});
	});

	return handleLogout;
};

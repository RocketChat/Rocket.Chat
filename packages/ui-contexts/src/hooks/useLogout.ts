import { useContext } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { UserContext } from '../UserContext';
import { useRouter } from './useRouter';

export const useLogout = (): (() => void) => {
	const router = useRouter();
	const { logout } = useContext(UserContext);

	const handleLogout = useMutableCallback(() => {
		logout();
		router.navigate('/');
	});

	return handleLogout;
};

import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useContext } from 'react';

import { UserContext } from '../UserContext';
import { useRouter } from './useRouter';

export const useLogout = (): (() => void) => {
	const router = useRouter();
	const { logout } = useContext(UserContext);

	const handleLogout = useEffectEvent(() => {
		logout();
		router.navigate('/');
	});

	return handleLogout;
};

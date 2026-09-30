import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useContext } from 'react';

import { useRouter } from '../RouterContext';
import { UserContext } from '../UserContext';

export const useLogout = (): (() => void) => {
	const router = useRouter();
	const { logout } = useContext(UserContext);

	return useStableCallback(() => {
		void logout();
		router.navigate('/');
	});
};

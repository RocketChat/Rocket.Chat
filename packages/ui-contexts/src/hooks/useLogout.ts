import { useContext } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { UserContext } from '../UserContext';
import { useNavigate } from './useNavigate';

export const useLogout = (): (() => void) => {
	const navigate = useNavigate();
	const { logout } = useContext(UserContext);

	const handleLogout = useMutableCallback(() => {
		logout();
		navigate('/');
	});

	return handleLogout;
};

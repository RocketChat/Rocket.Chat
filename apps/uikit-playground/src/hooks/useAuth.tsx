import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { userType } from '../Context/initialState';

const AuthContext = createContext<{
	user?: userType;
	login?: (data: userType) => Promise<void>;
	logout?: () => void;
}>({});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useLocalStorage<userType>('user', null);
	const navigate = useNavigate();

	const login = async (data: userType) => {
		setUser(data);
		navigate('/dashboard/profile', { replace: true });
	};

	const logout = () => {
		setUser(null);
		navigate('/', { replace: true });
	};

	const value = useMemo(
		() => ({
			user,
			login,
			logout,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

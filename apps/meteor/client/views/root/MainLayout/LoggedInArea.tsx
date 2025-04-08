import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

const LoggedInArea = ({ children }: { children: ReactNode }) => {
	const user = useUser();

	if (!user) {
		throw new Error('User not logged');
	}

	return children;
};

export default LoggedInArea;

import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useLoginMethod } from './hooks/useLoginMethod';

const LoginTokenRoute = () => {
	const router = useRouter();
	const loginMethod = useLoginMethod();

	useEffect(() => {
		loginMethod(
			{
				token: router.getRouteParameters().token,
			},
			(error) => {
				console.error(error);
				router.navigate('/');
			},
		);
	}, [loginMethod, router]);

	return null;
};

export default LoginTokenRoute;

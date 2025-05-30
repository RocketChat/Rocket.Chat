import { useLoginWithTokenRoute, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const LoginTokenRoute = () => {
	const router = useRouter();
	const loginMethod = useLoginWithTokenRoute();

	useEffect(() => {
		loginMethod(router.getRouteParameters().token, (error) => {
			console.error(error);
			router.navigate('/');
		});
	}, [loginMethod, router]);

	return null;
};

export default LoginTokenRoute;

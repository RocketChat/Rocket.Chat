import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const LoginRoute = () => {
	const router = useRouter();

	useEffect(() => {
		router.navigate('/home');
	}, [router]);

	return null;
};

export default LoginRoute;

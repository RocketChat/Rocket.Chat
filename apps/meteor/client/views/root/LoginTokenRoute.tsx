import { useRouter } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { useEffect } from 'react';

const LoginTokenRoute = () => {
	const router = useRouter();

	useEffect(() => {
		Accounts.callLoginMethod({
			methodArguments: [
				{
					loginToken: router.getRouteParameters().token,
				},
			],
			userCallback(error) {
				console.error(error);
				router.navigate('/');
			},
		});
	}, [router]);

	return null;
};

export default LoginTokenRoute;

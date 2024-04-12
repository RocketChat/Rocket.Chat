import { useRouter, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

const SAMLLoginRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const { token } = router.getRouteParameters();
		Meteor.loginWithSamlToken(token, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});
	}, [dispatchToastMessage, router]);

	const userId = useUserId();
	useEffect(() => {
		if (!userId) {
			return;
		}

		router.navigate(
			{
				pathname: '/home',
			},
			{ replace: true },
		);
	}, [userId, router]);

	return null;
};

export default SAMLLoginRoute;

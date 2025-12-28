import { useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { useSamlInviteToken } from '../invite/hooks/useSamlInviteToken';

const SAMLLoginRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const [inviteToken] = useSamlInviteToken();

	useEffect(() => {
		const { token } = router.getRouteParameters();

		Meteor.loginWithSamlToken(token, (error?: unknown) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			if (inviteToken) {
				router.navigate(
					{
						pathname: `/invite/${inviteToken}`,
					},
					{ replace: true },
				);
			} else {
				router.navigate(
					{
						pathname: '/home',
					},
					{ replace: true },
				);
			}
		});
	}, [dispatchToastMessage, inviteToken, router]);

	return null;
};

export default SAMLLoginRoute;

import { useRouter, useToastMessageDispatch, useSearchParameter } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { buildSamlDeepLinkURL } from '../../lib/buildAuthDeeplinkURL';
import { useSamlInviteToken } from '../invite/hooks/useSamlInviteToken';

const SAMLLoginRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const [inviteToken] = useSamlInviteToken();
	const loginClient = useSearchParameter('loginClient');

	useEffect(() => {
		const { token } = router.getRouteParameters();
		let timeout: NodeJS.Timeout;

		//SAML token handoff to the native client (mobile/desktop)
		if (loginClient === 'desktop' || loginClient === 'mobile') {
			window.location.href = buildSamlDeepLinkURL(token);
			timeout = setTimeout(() => {
				router.navigate('/home', { replace: true });
			}, 0);
			return;
		}

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

		return () => clearTimeout(timeout);
	}, [dispatchToastMessage, inviteToken, loginClient, router]);

	return null;
};

export default SAMLLoginRoute;

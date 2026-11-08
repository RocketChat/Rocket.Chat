import { useRouter, useToastMessageDispatch, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { buildSamlDeepLinkURL } from '../../lib/buildAuthDeeplinkURL';
import { loginWithSamlToken } from '../../meteor/login/saml';
import { useSamlInviteToken } from '../invite/hooks/useSamlInviteToken';

const SAMLLoginRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const [inviteToken] = useSamlInviteToken();
	const loginClient = useSearchParameter('loginClient');

	// The credential token is single-use, so the login handoff must fire only once
	const sentLoginRequest = useRef(false);

	useEffect(() => {
		if (sentLoginRequest.current) {
			return;
		}
		sentLoginRequest.current = true;

		const { token } = router.getRouteParameters();

		//SAML token handoff to the native client (mobile/desktop)
		if (loginClient === 'desktop' || loginClient === 'mobile') {
			window.location.href = buildSamlDeepLinkURL(token);
			const timeout = setTimeout(() => {
				router.navigate('/home', { replace: true });
			}, 0);
			return () => clearTimeout(timeout);
		}

		void loginWithSamlToken(token, (error?: unknown) => {
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
	}, [dispatchToastMessage, inviteToken, loginClient, router]);

	return null;
};

export default SAMLLoginRoute;

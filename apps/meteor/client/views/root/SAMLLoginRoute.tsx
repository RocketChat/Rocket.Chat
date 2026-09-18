import { useRouter, useToastMessageDispatch, useSearchParameter, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect, useRef } from 'react';

import { buildSamlDeepLinkURL } from '../../lib/buildAuthDeeplinkURL';
import { useSamlInviteToken } from '../invite/hooks/useSamlInviteToken';

const SAMLLoginRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const [inviteToken] = useSamlInviteToken();
	const loginClient = useSearchParameter('loginClient');
	const enableModernOAuthFlow = useSetting<boolean | undefined>('Accounts_OAuth_Use_Modern_Flow', undefined);

	// The credential token is single-use, so the login handoff must fire only once
	const sentLoginRequest = useRef(false);

	useEffect(() => {
		// Do not process the useEffect until the setting value is loaded
		if (enableModernOAuthFlow === undefined) {
			return;
		}

		if (sentLoginRequest.current) {
			return;
		}
		sentLoginRequest.current = true;

		const { token } = router.getRouteParameters();

		//SAML token handoff to the native client (mobile/desktop)
		if (enableModernOAuthFlow && (loginClient === 'desktop' || loginClient === 'mobile')) {
			window.location.href = buildSamlDeepLinkURL(token);
			const timeout = setTimeout(() => {
				router.navigate('/home', { replace: true });
			}, 0);
			return () => clearTimeout(timeout);
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
	}, [dispatchToastMessage, enableModernOAuthFlow, inviteToken, loginClient, router]);

	return null;
};

export default SAMLLoginRoute;

import { useEndpoint, useRouter, useSearchParameter, useLoginWithToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';

export const useOAuthLogin = () => {
	const router = useRouter();
	const loginCode = useSearchParameter('loginCode');
	const loginClient = useSearchParameter('loginClient');
	const redeemLoginCode = useEndpoint('POST', '/v1/loginCode.redeem');
	const loginWithToken = useLoginWithToken();

	useEffect(() => {
		if (!loginCode) {
			return;
		}

		let timeout: ReturnType<typeof setTimeout>;

		const handleLogin = async () => {
			try {
				const { loginToken, userId } = await redeemLoginCode({ code: loginCode });

				if (!loginToken || !userId) {
					throw new Error('Invalid response from login code redemption');
				}

				if (loginClient === 'desktop' || loginClient === 'mobile') {
					const loginURL = buildDeepLinkURL(loginToken, userId);
					window.location.href = loginURL;
					return;
				}

				await loginWithToken(loginToken);
			} catch (error) {
				console.error('Failed to redeem login code for client redirect', error);
				router.navigate('/login', { replace: true });
			} finally {
				timeout = setTimeout(() => {
					router.navigate('/home', { replace: true });
				}, 0);
			}
		};

		handleLogin();

		return () => clearTimeout(timeout);
	}, [loginCode, router, redeemLoginCode, loginWithToken, loginClient]);
};

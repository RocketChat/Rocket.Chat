import { useEndpoint, useRouter, useSearchParameter, useLoginWithToken } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';

export const useOAuthLogin = () => {
	const router = useRouter();
	const loginCode = useSearchParameter('loginCode');
	const loginClient = useSearchParameter('loginClient');
	const redeemLoginCode = useEndpoint('POST', '/v1/loginCode.redeem');
	const loginWithToken = useLoginWithToken();

	const { mutate: redeemLoginCodeMutation } = useMutation({
		mutationFn: async (loginCode: string) => {
			const { loginToken, userId } = await redeemLoginCode({ code: loginCode });

			if (!loginToken || !userId) {
				throw new Error('Invalid response from login code redemption');
			}

			return { loginToken, userId };
		},
		onSuccess: async ({ loginToken, userId }) => {
			if (loginClient === 'desktop' || loginClient === 'mobile') {
				window.location.href = buildDeepLinkURL(loginToken, userId);
				return;
			}

			await loginWithToken(loginToken);
			router.navigate('/home', { replace: true });
		},
		onError: (error) => {
			console.error('Failed to redeem login code for client redirect', error);
			router.navigate('/login', { replace: true });
		},
	});

	useEffect(() => {
		if (!loginCode) {
			return;
		}

		redeemLoginCodeMutation(loginCode);
	}, [loginCode, redeemLoginCodeMutation]);
};

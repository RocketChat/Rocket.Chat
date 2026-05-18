import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Page } from '@rocket.chat/ui-client';
import { useEndpoint, useLoginWithToken, useRouteParameter, useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import TwoFactorModal from '../../components/TwoFactorModal/TwoFactorModal';

const throwErrorOnInvalidMethod = (method: never): never => {
	throw new Error(`Invalid Two Factor method: ${method}`);
};

const OAuthTwoFactorAuthenticationRouter = () => {
	const method = useRouteParameter('method') as 'totp' | 'email' | undefined;
	const challengeId = useRouteParameter('challengeId');
	const router = useRouter();

	const setModal = useSetModal();
	const loginWithToken = useLoginWithToken();

	const verifyChallenge = useEndpoint('POST', '/v1/twoFactorChallenges.verifyChallenge');
	const sendEmailCode = useEndpoint('POST', '/v1/twoFactorChallenges.sendEmailCode');

	const navigateToHome = useStableCallback(() => {
		setModal(null);
		router.navigate('/home', { replace: true });
	});

	const resendEmail = useStableCallback(async () => {
		if (!challengeId) {
			return null;
		}
		await sendEmailCode({ challengeId });
		return null;
	});

	const onConfirm = useStableCallback(async (code: string) => {
		if (!challengeId || !code) {
			return;
		}
		try {
			const { loginToken } = await verifyChallenge({ challengeId, code });
			await loginWithToken(loginToken);
			navigateToHome();
		} catch (error: any) {
			console.error('Failed to verify challenge', error);
			throw error;
		}
	});

	useEffect(() => {
		if (!method || !challengeId) {
			router.navigate('/home');
			return;
		}

		if (method === 'email') {
			setModal(<TwoFactorModal method={method} onConfirm={onConfirm} resendEmail={resendEmail} onClose={navigateToHome} />);
			return;
		}

		if (method === 'totp') {
			setModal(<TwoFactorModal method={method} onConfirm={onConfirm} onClose={navigateToHome} />);
			return;
		}

		throwErrorOnInvalidMethod(method);
	}, [method, challengeId, router, setModal, onConfirm, resendEmail, navigateToHome]);

	return <Page />;
};

export default OAuthTwoFactorAuthenticationRouter;

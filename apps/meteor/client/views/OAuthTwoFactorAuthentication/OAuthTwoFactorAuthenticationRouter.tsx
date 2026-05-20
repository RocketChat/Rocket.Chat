import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Page } from '@rocket.chat/ui-client';
import {
	useEndpoint,
	useLoginWithToken,
	useRouteParameter,
	useRouter,
	useSetModal,
	useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import TwoFactorModal from '../../components/TwoFactorModal/TwoFactorModal';

const throwErrorOnInvalidMethod = (method: never): never => {
	throw new Error(`Invalid Two Factor method: ${method}`);
};

const OAuthTwoFactorAuthenticationRouter = () => {
	const method = useRouteParameter('method') as 'totp' | 'email' | undefined;
	const challengeId = useRouteParameter('challengeId');
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const loginWithToken = useLoginWithToken();
	const { t } = useTranslation();
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
			const { loginToken, userId } = await verifyChallenge({ challengeId, code });

			const { loginClient } = router.getSearchParameters();

			if (loginClient === 'mobile' || loginClient === 'desktop') {
				setModal(null);
				router.navigate({ name: 'home', search: { resumeToken: loginToken, userId, loginClient } }, { replace: true });
				return;
			}

			await loginWithToken(loginToken);
			navigateToHome();
		} catch (error: any) {
			console.error('Failed to verify challenge', error);
			if (error.errorType === 'totp-max-attempts') {
				setModal(null);
				dispatchToastMessage({ type: 'error', message: t('Maximum_number_of_attempts_reached_please_try_again_later') });
				router.navigate('/login', { replace: true });
				return;
			}
			if (error.errorType === 'error-challenge-expired' || error.errorType === 'error-challenge-not-found') {
				setModal(null);
				dispatchToastMessage({ type: 'error', message: t('Challenge_expired_please_try_again_later') });
				router.navigate('/login', { replace: true });
				return;
			}
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

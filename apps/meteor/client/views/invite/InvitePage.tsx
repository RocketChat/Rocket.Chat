import { HeroLayout, HeroLayoutTitle } from '@rocket.chat/layout';
import {
	useToastMessageDispatch,
	useSessionDispatch,
	useRouteParameter,
	useUserId,
	useSetting,
	useTranslation,
	useRouter,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect } from 'react';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import LoginPage from '../root/MainLayout/LoginPage';
import PageLoading from '../root/PageLoading';

const InvitePage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const token = useRouteParameter('hash');
	const registrationForm = useSetting('Accounts_RegistrationForm');
	const setLoginDefaultState = useSessionDispatch('loginDefaultState');
	const userId = useUserId();
	const router = useRouter();

	const handleInviteRoom = useCallback(async () => {
		if (!token) {
			return;
		}

		try {
			const result = await sdk.rest.post('/v1/useInviteToken', { token });

			if (!result.room.name) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
				router.navigate('/home');
				return;
			}

			if (result.room.t === 'p') {
				router.navigate(`/group/${result.room.name}`);
				return;
			}

			router.navigate(`/channel/${result.room.name}`);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
			router.navigate('/home');
		}
	}, [t, dispatchToastMessage, router, token]);

	const { isLoading, data } = useQuery(
		['invite', token],
		async () => {
			if (!token) {
				return false;
			}

			try {
				const { valid } = await sdk.rest.post('/v1/validateInviteToken', { token });

				return valid;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_validate_invite_token') });
				return false;
			}
		},
		{
			onSuccess: async (valid) => {
				if (registrationForm !== 'Disabled') {
					setLoginDefaultState('register');
				} else {
					setLoginDefaultState('login');
				}

				if (!valid || !userId) {
					return;
				}

				return handleInviteRoom();
			},
		},
	);

	useEffect(() => {
		if (userId) {
			handleInviteRoom();
		}
	}, [handleInviteRoom, userId]);

	if (data) {
		return <LoginPage />;
	}

	if (isLoading) {
		return <PageLoading />;
	}

	return (
		<HeroLayout>
			<HeroLayoutTitle>{t('Invalid_or_expired_invite_token')}</HeroLayoutTitle>
		</HeroLayout>
	);
};

export default InvitePage;

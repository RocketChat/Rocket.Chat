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
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

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

	const inviteTokenMutation = useMutation({
		mutationFn: (token: string) => sdk.rest.post('/v1/useInviteToken', { token }),
		onSuccess: (result) => {
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
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
			router.navigate('/home');
		},
	});

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
				if (!token) {
					return;
				}

				if (registrationForm !== 'Disabled') {
					setLoginDefaultState('register');
				} else {
					setLoginDefaultState('login');
				}

				if (!valid || !userId) {
					return;
				}

				return inviteTokenMutation.mutate(token);
			},
		},
	);

	useEffect(() => {
		if (userId && token) {
			inviteTokenMutation.mutate(token);
		}
	}, [inviteTokenMutation, token, userId]);

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

import { HeroLayout, HeroLayoutTitle } from '@rocket.chat/layout';
import { useRouteParameter, useSessionDispatch, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import LoginPage from '../root/MainLayout/LoginPage';
import PageLoading from '../root/PageLoading';
import { useInviteTokenMutation } from './hooks/useInviteTokenMutation';
import { useValidateInviteQuery } from './hooks/useValidateInviteQuery';

const InvitePage = (): ReactElement => {
	const { t } = useTranslation();

	const token = useRouteParameter('hash');
	const userId = useUserId();
	const { isPending, data: isValidInvite } = useValidateInviteQuery(token);

	const getInviteRoomMutation = useInviteTokenMutation();

	const registrationForm = useSetting('Accounts_RegistrationForm');
	const setLoginDefaultState = useSessionDispatch('loginDefaultState');

	useEffect(() => {
		if (isValidInvite) {
			if (registrationForm !== 'Disabled') {
				setLoginDefaultState('invite-register');
			} else {
				setLoginDefaultState('login');
			}

			if (!token || !isValidInvite || !userId) {
				return;
			}

			getInviteRoomMutation(token);
		}
	}, [getInviteRoomMutation, isValidInvite, registrationForm, setLoginDefaultState, token, userId]);

	if (isPending) {
		return <PageLoading />;
	}

	if (isValidInvite) {
		return <LoginPage />;
	}

	return (
		<HeroLayout>
			<HeroLayoutTitle>{t('Invalid_or_expired_invite_token')}</HeroLayoutTitle>
		</HeroLayout>
	);
};

export default InvitePage;

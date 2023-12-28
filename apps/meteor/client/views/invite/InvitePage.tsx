import { HeroLayout, HeroLayoutTitle } from '@rocket.chat/layout';
import { useRouteParameter, useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import LoginPage from '../root/MainLayout/LoginPage';
import PageLoading from '../root/PageLoading';
import { useInviteTokenMutation } from './hooks/useInviteTokenMutation';
import { useValidateInviteQuery } from './hooks/useValidateInviteQuery';

const InvitePage = (): ReactElement => {
	const t = useTranslation();

	const token = useRouteParameter('hash');
	const userId = useUserId();
	const { isLoading, data: isValidInvite } = useValidateInviteQuery(userId, token);

	const getInviteRoomMutation = useInviteTokenMutation();

	useEffect(() => {
		if (userId && token) {
			getInviteRoomMutation(token);
		}
	}, [getInviteRoomMutation, token, userId]);

	if (isLoading) {
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

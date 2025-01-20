import { HeroLayout, HeroLayoutTitle } from '@rocket.chat/layout';
import { useRouteParameter, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import LoginPage from '../root/MainLayout/LoginPage';
import PageLoading from '../root/PageLoading';
import { useInviteTokenMutation } from './hooks/useInviteTokenMutation';
import { useSamlInviteToken } from './hooks/useSamlInviteToken';
import { useValidateInviteQuery } from './hooks/useValidateInviteQuery';

const InvitePage = (): ReactElement => {
	const { t } = useTranslation();

	const token = useRouteParameter('hash');
	const userId = useUserId();
	const { isPending, data: isValidInvite } = useValidateInviteQuery(userId, token);
	const [, setToken] = useSamlInviteToken();

	const getInviteRoomMutation = useInviteTokenMutation();

	useEffect(() => {
		setToken(token || null);
		if (userId && token) {
			getInviteRoomMutation(token);
		}
	}, [getInviteRoomMutation, setToken, token, userId]);

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

import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { UserContext, useTranslation, useUser, useRoute } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';

const ConferenceUnauthorizedPage = () => {
	const t = useTranslation();
	const user = useUser();
	// Use the raw context logout (not `useLogout`, which redirects to `/`) so we stay on the
	// `/conference/:id` URL — after logging back in, the user lands right back on this conference.
	const { logout } = useContext(UserContext);
	const loginRoute = useRoute('login');

	return (
		<Page background='tint'>
			<PageHeader title={t('Video_Conference')} />
			<PageContent display='flex' alignItems='center' justifyContent='center'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('You_are_not_authorized_to_view_this_page')}</StatesTitle>
					{user?.username && <StatesSubtitle>{`${t('You_are_logged_in_as')} ${user.username}`}</StatesSubtitle>}
					<StatesActions>
						{/* Logged in with the wrong account? Log out without navigating away so the conference
						    route stays and re-login returns here. If somehow not logged in, go to login. */}
						{user ? (
							<StatesAction onClick={() => void logout()}>{t('Logout')}</StatesAction>
						) : (
							<StatesAction onClick={() => loginRoute.push()}>{t('Back_to_login')}</StatesAction>
						)}
					</StatesActions>
				</States>
			</PageContent>
		</Page>
	);
};

export default ConferenceUnauthorizedPage;

import { UserContext, useTranslation, useUser, useRoute } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';

import ConferenceStatePage from './ConferenceStatePage';

const ConferenceUnauthorizedPage = () => {
	const t = useTranslation();
	const user = useUser();
	// Use the raw context logout (not `useLogout`, which redirects to `/`) so we stay on the
	// `/conference/:id` URL — after logging back in, the user lands right back on this conference.
	const { logout } = useContext(UserContext);
	const loginRoute = useRoute('login');

	return (
		<ConferenceStatePage
			icon='warning'
			title={t('You_are_not_authorized_to_view_this_page')}
			subtitle={user?.username && `${t('You_are_logged_in_as')} ${user.username}`}
			// Logged in with the wrong account? Log out without navigating away so the conference route stays and
			// re-login returns here. If somehow not logged in, go to login.
			action={user ? { label: t('Logout'), onClick: () => void logout() } : { label: t('Back_to_login'), onClick: () => loginRoute.push() }}
		/>
	);
};

export default ConferenceUnauthorizedPage;

import { useTranslation, useUser, useRoute } from '@rocket.chat/ui-contexts';

import ConferenceStatePage from './ConferenceStatePage';

const ConferencePageError = () => {
	const t = useTranslation();
	const user = useUser();
	const route = useRoute('login');

	return (
		<ConferenceStatePage
			icon='circle-exclamation'
			title={t('Call_not_found')}
			subtitle={t('Call_not_found_error')}
			// A logged-in user is already where they can act; only someone who isn't has somewhere to be sent.
			action={user ? undefined : { label: t('Back_to_login'), onClick: () => route.push() }}
		/>
	);
};

export default ConferencePageError;

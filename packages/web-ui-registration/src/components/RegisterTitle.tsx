import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

export const RegisterTitle = (): ReactElement | null => {
	const siteName = useSetting('Site_Name', 'Rocket.Chat');
	const hideTitle = useSetting('Layout_Login_Hide_Title', false);

	if (hideTitle) {
		return null;
	}

	return (
		<span id='welcomeTitle'>
			<Trans i18nKey='registration.component.welcome'>Welcome to {siteName} workspace</Trans>
		</span>
	);
};

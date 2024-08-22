import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

export const RegisterTitle = (): ReactElement | null => {
	const siteName = useSetting<string>('Site_Name');
	const hideTitle = useSetting<boolean>('Layout_Login_Hide_Title');

	if (hideTitle) {
		return null;
	}

	return (
		<span id='welcomeTitle'>
			<Trans i18nKey='registration.component.welcome'>Welcome to {siteName} workspace</Trans>
		</span>
	);
};

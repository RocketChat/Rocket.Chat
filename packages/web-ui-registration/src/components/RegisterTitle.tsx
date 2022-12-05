import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

export const RegisterTitle = (): ReactElement => {
	const siteName = String(useSetting('Site_Name'));
	return <Trans i18nKey='registration.component.welcome'>Welcome to {siteName} workspace</Trans>;
};

import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { Trans } from 'react-i18next';

export const RegisterTitle = (): ReactElement => {
	const siteName = String(useSetting('Site_Name'));
	return (
		<Trans i18nKey='registration.component.welcome'>
			Welcome to{' '}
			<Box is='span' color='primary-500'>
				{siteName}
			</Box>
		</Trans>
	);
};

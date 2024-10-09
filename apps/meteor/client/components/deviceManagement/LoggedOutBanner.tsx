import { Banner, Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const LoggedOutBanner = (): ReactElement => {
	const t = useTranslation();

	return (
		<Banner variant='warning' icon={<Icon name='warning' size='x24' />}>
			<Box textAlign='left'>{t('Logged_Out_Banner_Text')}</Box>
		</Banner>
	);
};

export default LoggedOutBanner;

import { Banner, Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const LoggedOutBanner = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Banner variant='warning' icon={<Icon name='warning' size='x24' />}>
			<Box textAlign='left'>{t('Logged_Out_Banner_Text')}</Box>
		</Banner>
	);
};

export default LoggedOutBanner;

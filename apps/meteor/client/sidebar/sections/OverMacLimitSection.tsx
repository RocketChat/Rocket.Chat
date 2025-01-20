import { Icon, SidebarBanner } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const OverMacLimitSection = (): ReactElement => {
	const { t } = useTranslation();

	const handleClick = () => {
		window.open('https://rocket.chat/pricing', '_blank');
	};

	return (
		<SidebarBanner
			text={t('You_have_reached_the_limit_active_costumers_this_month')}
			description={t('Learn_more')}
			addon={<Icon name='warning' color='danger' size='x24' />}
			onClick={handleClick}
		/>
	);
};

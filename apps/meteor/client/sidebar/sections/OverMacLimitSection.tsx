import { Icon, SidebarBanner } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { links } from '../../lib/links';

export const OverMacLimitSection = (): ReactElement => {
	const { t } = useTranslation();

	const handleClick = useEffectEvent(() => window.open(links.go.pricing));

	return (
		<SidebarBanner
			text={t('You_have_reached_the_limit_active_costumers_this_month')}
			description={t('Learn_more')}
			addon={<Icon name='warning' color='danger' size='x24' />}
			onClick={handleClick}
		/>
	);
};

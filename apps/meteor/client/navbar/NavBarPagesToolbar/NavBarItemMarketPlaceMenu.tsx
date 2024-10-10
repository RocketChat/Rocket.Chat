import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { useMarketPlaceMenu } from './hooks/useMarketPlaceMenu';

type NavBarItemMarketPlaceMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemMarketPlaceMenu = (props: NavBarItemMarketPlaceMenuProps) => {
	const t = useTranslation();
	const sections = useMarketPlaceMenu();

	const currentRoute = useCurrentRoutePath();

	return (
		<GenericMenu
			sections={sections}
			title={t('Marketplace')}
			is={NavBarItem}
			placement='bottom-start'
			icon='store'
			pressed={currentRoute?.includes('/marketplace')}
			{...props}
		/>
	);
};

export default NavBarItemMarketPlaceMenu;

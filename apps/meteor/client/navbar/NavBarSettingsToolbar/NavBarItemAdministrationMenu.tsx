import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { useAdministrationMenu } from './hooks/useAdministrationMenu';

type NavBarItemAdministrationMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemAdministrationMenu = (props: NavBarItemAdministrationMenuProps) => {
	const t = useTranslation();
	const currentRoute = useCurrentRoutePath();

	const sections = useAdministrationMenu();

	if (!sections[0].items.length) {
		return null;
	}
	return (
		<GenericMenu
			sections={sections}
			title={t('Manage')}
			is={NavBarItem}
			icon='cog'
			pressed={currentRoute?.includes('/omnichannel/') || currentRoute?.includes('/admin')}
			placement='bottom-end'
			{...props}
		/>
	);
};

export default NavBarItemAdministrationMenu;

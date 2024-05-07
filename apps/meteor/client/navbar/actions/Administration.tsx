import { NavBarItem } from '@rocket.chat/fuselage';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useAdministrationMenu } from './hooks/useAdministrationMenu';

const NavBarAdministrationMenu: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();
	const currentRoute = useCurrentRoutePath();

	const sections = useAdministrationMenu();

	return (
		<GenericMenu
			sections={sections}
			title={t('Administration')}
			is={NavBarItem}
			pressed={currentRoute?.includes('/omnichannel') || currentRoute?.includes('/admin')}
			{...props}
		/>
	);
};

export default NavBarAdministrationMenu;

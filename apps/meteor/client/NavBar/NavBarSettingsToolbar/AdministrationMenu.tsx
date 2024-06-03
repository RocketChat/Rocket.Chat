import { NavBarItem } from '@rocket.chat/fuselage';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useAdministrationMenu } from './hooks/useAdministrationMenu';

export const NavBarItemAdministrationMenu = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
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
			pressed={currentRoute?.includes('/omnichannel') || currentRoute?.includes('/admin')}
			placement='bottom-end'
			{...props}
		/>
	);
};

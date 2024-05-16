import { NavBarItem } from '@rocket.chat/fuselage';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useManageMenu } from './hooks/useManageMenu';

export const NavBarItemManageMenu = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
	const t = useTranslation();
	const currentRoute = useCurrentRoutePath();

	const sections = useManageMenu();

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

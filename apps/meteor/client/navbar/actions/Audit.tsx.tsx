import { NavBarItem } from '@rocket.chat/fuselage';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useAuditMenu } from './hooks/useAuditMenu';

const NavBarAuditMenu: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();
	const sections = useAuditMenu();
	const currentRoute = useCurrentRoutePath();

	return (
		<GenericMenu
			items={sections}
			title={t('Audit')}
			is={NavBarItem}
			placement='bottom-start'
			icon='document-eye'
			pressed={currentRoute?.includes('/home')}
			{...props}
		/>
	);
};

export default NavBarAuditMenu;

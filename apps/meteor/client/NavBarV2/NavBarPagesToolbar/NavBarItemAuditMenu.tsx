import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { useAuditMenu } from './hooks/useAuditMenu';

type NavBarItemAuditMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemAuditMenu = (props: NavBarItemAuditMenuProps) => {
	const t = useTranslation();
	const sections = useAuditMenu();
	const currentRoute = useCurrentRoutePath();

	return (
		<GenericMenu
			sections={sections}
			title={t('Audit')}
			is={NavBarItem}
			placement='bottom-start'
			icon='document-eye'
			pressed={currentRoute?.includes('/audit')}
			{...props}
		/>
	);
};

export default NavBarItemAuditMenu;

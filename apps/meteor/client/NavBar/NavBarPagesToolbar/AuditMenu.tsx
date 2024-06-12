import { NavBarItem } from '@rocket.chat/fuselage';
import { useCurrentRoutePath, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useAuditMenu } from './hooks/useAuditMenu';

export const NavBarItemAuditMenu = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
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

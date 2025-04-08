import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdministrationMenu } from './hooks/useAdministrationMenu';
import { useAuditMenu } from './hooks/useAuditMenu';

type NavBarItemAdministrationMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemAdministrationMenu = (props: NavBarItemAdministrationMenuProps) => {
	const { t } = useTranslation();
	const currentRoute = useCurrentRoutePath();

	const adminSection = useAdministrationMenu();
	const auditSection = useAuditMenu();

	const sections = [adminSection, auditSection].filter((section) => section.items.length > 0);

	if (sections.every((section) => section.items.length === 0)) {
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

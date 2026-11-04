import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from '../../navbar/NavBarPagesGroup/hooks/useSortMenu';

type SidebarRailPreferencesProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * The sidebar's display, sort and grouping preferences. They live in the rail, next to Manage, because they shape
 * both the Inbox and the Teams panel.
 */
const SidebarRailPreferences = (props: SidebarRailPreferencesProps) => {
	const { t } = useTranslation();
	const sections = useSortMenu();

	return (
		<GenericMenu
			sections={sections}
			selectionMode='multiple'
			title={t('Sidebar_preferences')}
			is={NavBarItem}
			icon='sidebar'
			placement='bottom-end'
			{...props}
		/>
	);
};

export default SidebarRailPreferences;

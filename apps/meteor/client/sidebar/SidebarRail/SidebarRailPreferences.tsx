import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from '../../navbar/NavBarPagesGroup/hooks/useSortMenu';

type SidebarRailPreferencesProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailPreferences = (props: SidebarRailPreferencesProps) => {
	const { t } = useTranslation();

	const sections = useSortMenu();

	return (
		<GenericMenu
			icon='sort'
			sections={sections}
			title={t('Sidebar_preferences')}
			selectionMode='multiple'
			is={NavBarItem}
			placement='right-start'
			{...props}
		/>
	);
};

export default SidebarRailPreferences;

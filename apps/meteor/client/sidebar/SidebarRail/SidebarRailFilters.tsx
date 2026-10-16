import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';

type SidebarRailFiltersProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailFilters = (props: SidebarRailFiltersProps) => {
	const { t } = useTranslation();
	const isActive = useSidebarRailStore((state) => state.panel === 'filters');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	return (
		<NavBarItem
			{...props}
			title={t('Filters')}
			icon='customize'
			pressed={isActive}
			aria-keyshortcuts='Control+Shift+F Meta+Shift+F'
			onClick={() => setPanel('filters')}
		/>
	);
};

export default SidebarRailFilters;

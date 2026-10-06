import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';

type SidebarRailSearchProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailSearch = (props: SidebarRailSearchProps) => {
	const { t } = useTranslation();
	const isActive = useSidebarRailStore((state) => state.panel === 'search');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	return (
		<NavBarItem
			{...props}
			title={t('Search')}
			icon='magnifier'
			pressed={isActive}
			aria-keyshortcuts='Control+K Meta+K Control+P Meta+P'
			onClick={() => setPanel('search')}
		/>
	);
};

export default SidebarRailSearch;

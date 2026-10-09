import { FocusScope } from '@react-aria/focus';
import { Sidepanel } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailFiltersHeader from './filters/SidebarRailFiltersHeader';
import SidebarRailFiltersList from './filters/SidebarRailFiltersList';
import { useSidebarRailStore } from './useSidebarRailStore';
import SidebarPortal from '../../portals/SidebarPortal';

const SidebarRailFiltersPanel = () => {
	const { t } = useTranslation();
	const isOpen = useSidebarRailStore((state) => state.panel === 'filters');

	// The sidebar region the panel is portaled into only exists after the layout's first commit.
	const [isLayoutMounted, setIsLayoutMounted] = useState(false);
	useEffect(() => setIsLayoutMounted(true), []);

	if (!isOpen || !isLayoutMounted) {
		return null;
	}

	return (
		<SidebarPortal>
			<Sidepanel role='region' aria-label={t('Filters')}>
				<FocusScope>
					<SidebarRailFiltersHeader />
					<SidebarRailFiltersList />
				</FocusScope>
			</Sidepanel>
		</SidebarPortal>
	);
};

export default SidebarRailFiltersPanel;

import { FocusScope } from '@react-aria/focus';
import { Sidepanel } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRailSearchPanelContent from './SidebarRailSearchPanelContent';
import { useSidebarRailStore } from './useSidebarRailStore';
import SidebarPortal from '../../portals/SidebarPortal';

const SidebarRailSearchPanel = () => {
	const { t } = useTranslation();
	const isOpen = useSidebarRailStore((state) => state.panel === 'search');

	// The sidebar region the panel is portaled into only exists after the layout's first commit.
	const [isLayoutMounted, setIsLayoutMounted] = useState(false);
	useEffect(() => setIsLayoutMounted(true), []);

	if (!isOpen || !isLayoutMounted) {
		return null;
	}

	return (
		<SidebarPortal>
			<Sidepanel role='search' aria-label={t('Search_rooms')}>
				<FocusScope>
					<SidebarRailSearchPanelContent />
				</FocusScope>
			</Sidepanel>
		</SidebarPortal>
	);
};

export default SidebarRailSearchPanel;

import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import { InlineMediaCallWidget } from '@rocket.chat/ui-voip';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';
import SidebarPortal from '../../portals/SidebarPortal';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();
	const { isEmbedded: embeddedLayout, isMobile } = useLayout();
	const isOpen = useSidebarRailStore((state) => state.panel === 'calls');
	const setPanel = useSidebarRailStore((state) => state.setPanel);
	const closeCalls = useSidebarRailStore((state) => state.closeCalls);

	// Arriving at the call history opens the calls panel; leaving it gives the sidebar back to the room list.
	useEffect(() => {
		setPanel('calls');

		return closeCalls;
	}, [setPanel, closeCalls]);

	return (
		<FeaturePreview feature='sidebarRail' disabled={embeddedLayout || isMobile}>
			<FeaturePreviewOn>
				{isOpen && (
					<SidebarPortal>
						<Sidepanel className='rcx-sidebar__fixed-width' role='complementary' aria-label={t('Calls')}>
							<Box padding={16}>
								<InlineMediaCallWidget />
							</Box>
						</Sidepanel>
					</SidebarPortal>
				)}
			</FeaturePreviewOn>
			<FeaturePreviewOff>{null}</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default SidebarRailCallPanel;

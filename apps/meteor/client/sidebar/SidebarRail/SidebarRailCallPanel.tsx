import { Box, Sidepanel } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import { InlineMediaCallWidget } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import SidebarPortal from '../../portals/SidebarPortal';

const SidebarRailCallPanel = () => {
	const { t } = useTranslation();
	const { isEmbedded: embeddedLayout, isMobile } = useLayout();

	return (
		<FeaturePreview feature='sidebarRail' disabled={embeddedLayout || isMobile}>
			<FeaturePreviewOn>
				<SidebarPortal>
					<Sidepanel role='complementary' aria-label={t('Calls')}>
						<Box padding={16}>
							<InlineMediaCallWidget />
						</Box>
					</Sidepanel>
				</SidebarPortal>
			</FeaturePreviewOn>
			<FeaturePreviewOff>{null}</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default SidebarRailCallPanel;

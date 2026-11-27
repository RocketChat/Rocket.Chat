import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Inbox from './Inbox';
import SidebarRoomList from './RoomList';
import TeamsPanel from './TeamsPanel';
import { useTeamsPanel } from './TeamsPanel/hooks/useTeamsPanel';
import SidebarFooter from './footer';
import BannerSection from './sections/BannerSection';
import NowPlayingSection from './sections/NowPlayingSection';

const Sidebar = () => {
	const { t } = useTranslation();
	const sidebarViewMode = useUserPreference<string>('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const {
		isEmbedded,
		sidebar: { shouldToggle },
	} = useLayout();
	const { open: teamsPanelOpen } = useTeamsPanel();

	return (
		<FuselageSidebar
			aria-label={t('Sidebar')}
			className={[
				'rcx-sidebar--main',
				'sidebar-region-item',
				sidebarViewMode && `rcx-sidebar--${sidebarViewMode}`,
				sidebarHideAvatar && 'rcx-sidebar--hide-avatar',
			]
				.filter(Boolean)
				.join(' ')}
		>
			<BannerSection />
			<FeaturePreview feature='sidebarRail' disabled={shouldToggle || isEmbedded}>
				<FeaturePreviewOn>{teamsPanelOpen ? <TeamsPanel /> : <Inbox />}</FeaturePreviewOn>
				<FeaturePreviewOff>
					<SidebarRoomList />
				</FeaturePreviewOff>
			</FeaturePreview>
			<NowPlayingSection />
			<SidebarFooter />
		</FuselageSidebar>
	);
};

export default memo(Sidebar);

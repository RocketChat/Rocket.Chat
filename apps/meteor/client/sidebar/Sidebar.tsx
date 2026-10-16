import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';
import SidebarRailSidebarHeader from './SidebarRail/SidebarRailSidebarHeader';
import SidebarFooter from './footer';
import BannerSection from './sections/BannerSection';
import NowPlayingSection from './sections/NowPlayingSection';

const Sidebar = () => {
	const { t } = useTranslation();
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = !useUserPreference('sidebarDisplayAvatar');
	const {
		isEmbedded,
		sidebar: { shouldToggle },
	} = useLayout();

	return (
		<FuselageSidebar
			aria-label={t('Sidebar')}
			className={[
				'rcx-sidebar--main',
				'sidebar-region-item',
				`rcx-sidebar--${sidebarViewMode}`,
				sidebarHideAvatar && 'rcx-sidebar--hide-avatar',
			]
				.filter(Boolean)
				.join(' ')}
		>
			<FeaturePreview feature='sidebarRail' disabled={shouldToggle || isEmbedded}>
				<FeaturePreviewOn>
					<SidebarRailSidebarHeader />
				</FeaturePreviewOn>
				<FeaturePreviewOff>{null}</FeaturePreviewOff>
			</FeaturePreview>
			<BannerSection />
			<SidebarRoomList />
			<NowPlayingSection />
			<SidebarFooter />
		</FuselageSidebar>
	);
};

export default memo(Sidebar);

import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import { useSidebarDisplayPreferences } from './hooks/useSidebarDisplayPreferences';
import BannerSection from './sections/BannerSection';
import NowPlayingSection from './sections/NowPlayingSection';

const Sidebar = () => {
	const { t } = useTranslation();
	const { viewMode, displayAvatar, displayPreview } = useSidebarDisplayPreferences();

	return (
		<FuselageSidebar
			aria-label={t('Sidebar')}
			className={[
				'rcx-sidebar--main',
				'sidebar-region-item',
				`rcx-sidebar--${viewMode}`,
				!displayAvatar && 'rcx-sidebar--hide-avatar',
				displayPreview && 'rcx-sidebar--show-preview',
			]
				.filter(Boolean)
				.join(' ')}
		>
			<BannerSection />
			<SidebarRoomList />
			<NowPlayingSection />
			<SidebarFooter />
		</FuselageSidebar>
	);
};

export default memo(Sidebar);

import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';
import SidebarFooter from './footer';
import { useSidebarPresentation } from './hooks/useSidebarPresentation';
import RoomListProvider from './providers/RoomListProvider';
import BannerSection from './sections/BannerSection';
import NowPlayingSection from './sections/NowPlayingSection';

const Sidebar = () => {
	const { t } = useTranslation();
	const { viewMode, showAvatar } = useSidebarPresentation();

	return (
		<FuselageSidebar
			aria-label={t('Sidebar')}
			className={['rcx-sidebar--main', 'sidebar-region-item', `rcx-sidebar--${viewMode}`, !showAvatar && 'rcx-sidebar--hide-avatar']
				.filter(Boolean)
				.join(' ')}
		>
			<BannerSection />
			<RoomListProvider>
				<SidebarRoomList />
			</RoomListProvider>
			<NowPlayingSection />
			<SidebarFooter />
		</FuselageSidebar>
	);
};

export default memo(Sidebar);
